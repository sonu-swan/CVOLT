import express from "express";
import isAuth from "../middlewares/isAuth.js";
import {
  analyzeInterview,
  finishInterview,
  generateQuestion,
  submitAnswer,
  getMyInterviews,
  getInterviewReport,
} from "../controllers/interview.controller.js";
import { upload } from "../middlewares/multer.js";

const interviewRouter = express.Router();

interviewRouter.post(
  "/resume",
  isAuth,
  upload.single("resume"),
  analyzeInterview,
);
interviewRouter.post("/generate-questions", isAuth, generateQuestion);
interviewRouter.post("/submit-answer", isAuth, submitAnswer);
interviewRouter.post("/finish", isAuth, finishInterview);

// These two were missing entirely — controllers existed but were never
// wired to a route, so the report page and interview-history calls were
// hitting a 404 no matter what the controller code did.
interviewRouter.get("/my-interviews", isAuth, getMyInterviews);
interviewRouter.get("/report/:id", isAuth, getInterviewReport);

export default interviewRouter;