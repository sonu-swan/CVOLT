import axios from "axios";

export const askAi = async (messages) => {
  try {
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error("Invalid messages array");
    }

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4.1-mini",
        messages,
        max_tokens: 1000,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const content = response?.data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in response");
    }

    // AI models often wrap JSON responses in markdown code fences
    // (```json ... ```). Strip those before returning, so every
    // caller doing JSON.parse(aiResponse) gets clean JSON instead
    // of crashing on the backticks.
    const cleaned = content
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    return cleaned;
  } catch (error) {
    console.error("openrouter error:", error.response?.data || error.message);
    throw new Error("Failed to get response from OpenRouter API");
  }
};

export default askAi;