import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { askAi } from "../services/openRouter.service.js";
import User from "../models/user.model.js"; // ⚠️ adjust path/name to match your actual User model
import Interview from "../models/interview.model.js";

// ---------------------------------------------------------------------
// NEW: safeJsonParse
// WHY: AI models frequently wrap JSON responses in markdown fences
// (```json ... ```) or add stray whitespace. Calling JSON.parse()
// directly on that throws, which was silently killing:
//   - analyzeInterview (resume -> role/experience/projects/skills/resumeText)
//   - evaluateAnswer
//   - submitAnswer
// This is the actual reason resume-based question generation looked
// broken: analyzeInterview was failing silently, so resumeText/projects/
// skills never made it to generateQuestion, which then had nothing
// resume-specific to work with.
// ---------------------------------------------------------------------
function safeJsonParse(raw) {
  if (!raw || !raw.trim()) {
    throw new Error("Empty AI response");
  }
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(cleaned);
}

export const analyzeInterview = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const filePath = req.file.path;
    const fileBuffer = await fs.promises.readFile(filePath);
    const unit8Array = new Uint8Array(fileBuffer);

    const pdf = await pdfjsLib.getDocument({ data: unit8Array }).promise;

    let resumeText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      resumeText += pageText + "\n";
    }

    resumeText = resumeText.replace(/\s+/g, " ").trim();

    const messages = [
      {
        role: "system",
        content: `Extract structured information from the resume and provide a summary of the candidate's skills, experience, and qualifications.

Calculate the candidate's total work experience by adding up the duration of all jobs and internships listed in the resume. Return ONLY the number of years as a string (e.g. "1", "2", "3"). If total experience is less than 1 year, return "0".

Return strictly JSON, no markdown fences, no extra text:
{
"role": "string",
"experience": "string (just the number of years, e.g. '1')",
"projects": ["project1", "project2"],
"skills": ["skill1", "skill2"],
"education": ["education1", "education2"],
"certifications": ["certification1", "certification2"],
"summary": "string"
}`,
      },
      {
        role: "user",
        content: resumeText,
      },
    ];

    const aiResponse = await askAi(messages);
    const parsed = safeJsonParse(aiResponse);

    fs.unlinkSync(filePath);
    res.json({
      role: parsed.role,
      experience: parsed.experience,
      projects: parsed.projects,
      skills: parsed.skills,
      resumeText: resumeText,
      education: parsed.education,
      certifications: parsed.certifications,
      summary: parsed.summary,
    });
  } catch (error) {
    console.error(error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ error: "Failed to analyze the interview" });
  }
};

export const generateQuestion = async (req, res) => {
  try {
    const {
      role: rawRole,
      experience: rawExperience,
      mode: rawMode,
      resumeText,
      projects,
      skills,
    } = req.body;

    const role = rawRole?.trim();
    const experience = rawExperience?.trim();
    const mode = rawMode?.trim();

    if (!role || !experience || !mode) {
      return res
        .status(400)
        .json({ message: "role, experience and mode are required." });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "user not found",
      });
    }
    if (user.credits < 50) {
      return res.status(400).json({
        message: "not enough credits. minimum 50 required",
      });
    }

    const projectText =
      Array.isArray(projects) && projects.length ? projects.join(", ") : "None";

    const skillsText =
      Array.isArray(skills) && skills.length ? skills.join(", ") : "None";

    const safeResume = resumeText?.trim() || "None";

    const userPrompt = `
Role:${role}
Experience:${experience}
InterviewMode:${mode}
Projects:${projectText}
Skills:${skillsText}
Resume:${safeResume}
`;

    if (!userPrompt.trim()) {
      return res.status(400).json({
        message: "Prompt content is empty.",
      });
    }

    const messages = [
      {
        role: "system",
        content: `
           You are a real human interviewer conducting a professional interview.

Speak in simple, natural English as if you are directly talking to the candidate.

Generate exactly 5 interview questions.

Strict Rules:
- Each question must contain between 15 and 25 words.
- Each question must be a single complete sentence.
- Do NOT number them.
- Do NOT add explanations.
- Do NOT add extra text before or after.
- One question per line only.
- Keep language simple and conversational.
- Questions must feel practical and realistic.

Difficulty progression:
Question 1 → easy  
Question 2 → easy  
Question 3 → medium  
Question 4 → medium  
Question 5 → hard  

Make questions based on the candidate’s role, experience,interviewMode, projects, skills, and resume details.
`,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ];

    const aiResponse = await askAi(messages);
    if (!aiResponse || !aiResponse.trim()) {
      return res.status(500).json({
        message: "AI returned empty response.",
      });
    }

    const questionsArray = aiResponse
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length > 0)
      .slice(0, 5);

    if (questionsArray.length === 0) {
      return res.status(500).json({
        message: "AI failed to generate questions.",
      });
    }

    const interview = await Interview.create({
      userId: user._id,
      role,
      experience,
      mode,
      resumeText: safeResume,
      questions: questionsArray.map((q, index) => ({
        question: q,
        difficulty: ["easy", "easy", "medium", "medium", "hard"][index],
        timeLimit: [60, 60, 90, 90, 120][index],
      })),
    });

    user.credits -= 50;
    await user.save();

    return res.json({
      interviewId: interview._id,
      creditsLeft: user.credits,
      userName: user.name,
      questions: interview.questions,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to generate questions." });
  }
};

export const evaluateAnswer = async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res
        .status(400)
        .json({ message: "question and answer are required." });
    }

    const feedbackMessages = [
      {
        role: "system",
        content: `
You are a professional human interviewer evaluating a candidate's answer in a real interview.

Evaluate naturally and fairly, like a real person would.

Score the answer in these areas (0 to 10):

1. Confidence – Does the answer sound clear, confident, and well-presented?
2. Communication – Is the language simple, clear, and easy to understand?
3. Correctness – Is the answer accurate, relevant, and complete?

Rules:
- Be realistic and unbiased.
- Do not give random high scores.
- If the answer is weak, score low.
- If the answer is strong and detailed, score high.
- Consider clarity, structure, and relevance.

Calculate:
finalScore = average of confidence, communication, and correctness (rounded to nearest whole number).

Feedback Rules:
- Write natural human feedback.
- 10 to 15 words only.
- Sound like real interview feedback.
- Can suggest improvement if needed.
- Do NOT repeat the question.
- Do NOT explain scoring.
- Keep tone professional and honest.

Return ONLY valid JSON, no markdown fences, in this format:

{
  "confidence": number,
  "communication": number,
  "correctness": number,
  "finalScore": number,
  "feedback": "short human feedback"
}
`,
      },
      {
        role: "user",
        content: `
Question: ${question}
Answer: ${answer}
`,
      },
    ];

    const aiResponse = await askAi(feedbackMessages);
    if (!aiResponse || !aiResponse.trim()) {
      return res.status(500).json({ message: "AI returned empty response." });
    }

    const parsed = safeJsonParse(aiResponse);

    return res.json(parsed);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to evaluate answer." });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const { interviewId, questionIndex, answer, timeTaken } = req.body;
    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({ message: "interview not found" });
    }

    const question = interview.questions[questionIndex];

    if (!question) {
      return res.status(400).json({ message: "invalid question index" });
    }

    if (!answer) {
      question.score = 0;
      question.feedback = "you did not submit an answer";
      question.answer = "";
      await interview.save();

      return res.json({
        feedback: question.feedback,
      });
    }

    if (timeTaken > question.timeLimit) {
      question.score = 0;
      question.feedback = "time limit exceeded answer not evaluated";
      question.answer = answer;
      await interview.save();
      return res.json({
        feedback: question.feedback,
      });
    }

    const feedbackMessages = [
      {
        role: "system",
        content: `
You are a professional human interviewer evaluating a candidate's answer in a real interview.

Evaluate naturally and fairly, like a real person would.

Score the answer in these areas (0 to 10):

1. Confidence – Does the answer sound clear, confident, and well-presented?
2. Communication – Is the language simple, clear, and easy to understand?
3. Correctness – Is the answer accurate, relevant, and complete?

Rules:
- Be realistic and unbiased.
- If the answer is weak, score low.
- If the answer is strong and detailed, score high.

Calculate:
finalScore = average of confidence, communication, and correctness (rounded to nearest whole number).

Feedback Rules:
- Write natural human feedback, 10 to 15 words only.
- Do NOT repeat the question.
- Do NOT explain scoring.

Return ONLY valid JSON, no markdown fences, in this format:

{
  "confidence": number,
  "communication": number,
  "correctness": number,
  "finalScore": number,
  "feedback": "short human feedback"
}
`,
      },
      {
        role: "user",
        content: `
Question: ${question.question}
Answer: ${answer}
`,
      },
    ];

    const aiResponse = await askAi(feedbackMessages);
    if (!aiResponse || !aiResponse.trim()) {
      return res.status(500).json({ message: "AI returned empty response." });
    }

    const parsed = safeJsonParse(aiResponse);

    question.answer = answer;
    question.confidence = parsed.confidence;
    question.communication = parsed.communication;
    question.correctness = parsed.correctness;
    question.score = parsed.finalScore;
    question.feedback = parsed.feedback;

    await interview.save();

    return res
      .status(200)
      .json({ feedback: parsed.feedback, score: parsed.finalScore });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: `failed to submit answer: ${error}` });
  }
};

export const finishInterview = async (req, res) => {
  try {
    const { interviewId } = req.body;
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(400).json({ message: "failed to find Interview" });
    }
    const totalQuestions = interview.questions.length;

    let totalScore = 0;
    let totalConfidence = 0;
    let totalCommunication = 0;
    let totalCorrectness = 0;

    interview.questions.forEach((q) => {
      totalScore += q.score || 0;
      totalConfidence += q.confidence || 0;
      totalCommunication += q.communication || 0;
      totalCorrectness += q.correctness || 0;
    });

    const finalScore = totalQuestions ? totalScore / totalQuestions : 0;
    const avgConfidence = totalQuestions ? totalConfidence / totalQuestions : 0;
    const avgCommunication = totalQuestions
      ? totalCommunication / totalQuestions
      : 0;
    const avgCorrectness = totalQuestions
      ? totalCorrectness / totalQuestions
      : 0;

    interview.finalScore = finalScore;
    interview.status = "completed";

    await interview.save();

    return res.status(200).json({
      finalScore: Number(finalScore.toFixed(1)),
      confidence: Number(avgConfidence.toFixed(1)),
      communication: Number(avgCommunication.toFixed(1)),
      correctness: Number(avgCorrectness.toFixed(1)),
      questionWiseScore: interview.questions.map((q) => ({
        question: q.question,
        score: q.score || 0,
        feedback: q.feedback || "",
        confidence: q.confidence || 0,
        communication: q.communication || 0,
        correctness: q.correctness || 0,
      })),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `failed to finish interview ${error}` });
  }
};

// ---------------------------------------------------------------------
// FIXED getMyInterviews:
// - "interview.findOne" -> "Interview.findOne" (lowercase var doesn't exist)
// - filter used undefined "userId" -> now uses req.userId
// - typos "ecperience" -> "experience", "creatAt" -> "createdAt" (x2)
// - was querying a single interview with .select() as if for a list;
//   changed to .find() since function name says "interviews" (plural)
// ---------------------------------------------------------------------
export const getMyInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select("role experience mode finalScore status createdAt");

    return res.status(200).json(interviews);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `failed to find currentUser Interview ${error}` });
  }
};

// ---------------------------------------------------------------------
// FIXED getInterviewReport:
// - All the averaging logic was written inside the CATCH block, so it
//   only ran when findById threw an error, and even then never called
//   res.json(...) — meaning this endpoint never sent a response on the
//   success path. This is almost certainly why your Report page had
//   nothing to render.
// - Moved logic into the try block and added the missing res.json().
// ---------------------------------------------------------------------
export const getInterviewReport = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    const totalQuestions = interview.questions.length;

    let totalConfidence = 0;
    let totalCommunication = 0;
    let totalCorrectness = 0;

    interview.questions.forEach((q) => {
      totalConfidence += q.confidence || 0;
      totalCommunication += q.communication || 0;
      totalCorrectness += q.correctness || 0;
    });

    const avgConfidence = totalQuestions ? totalConfidence / totalQuestions : 0;
    const avgCommunication = totalQuestions
      ? totalCommunication / totalQuestions
      : 0;
    const avgCorrectness = totalQuestions
      ? totalCorrectness / totalQuestions
      : 0;

    return res.status(200).json({
      role: interview.role,
      experience: interview.experience,
      mode: interview.mode,
      finalScore: interview.finalScore || 0,
      status: interview.status,
      confidence: Number(avgConfidence.toFixed(1)),
      communication: Number(avgCommunication.toFixed(1)),
      correctness: Number(avgCorrectness.toFixed(1)),
      questionWiseScore: interview.questions.map((q) => ({
        question: q.question,
        answer: q.answer || "",
        score: q.score || 0,
        feedback: q.feedback || "",
        confidence: q.confidence || 0,
        communication: q.communication || 0,
        correctness: q.correctness || 0,
      })),
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: `failed to get interview report ${error}` });
  }
};
