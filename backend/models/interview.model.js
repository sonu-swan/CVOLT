import mongoose from "mongoose";

const questionsSchema = new mongoose.Schema({
  question: String,
  difficulty: String,
  timeLimit: Number,
  answer: String,
  feedback: String,
  score: { type: Number, default: 0 },
  confidence: { type: Number, default: 0 },
  communication: { type: Number, default: 0 },
  correctness: { type: Number, default: 0 },
});

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    experience: {
      type: String,
      required: true,
    },
    mode: {
      type: String,
      enum: ["HR", "Technical"],
      required: true,
      // Normalizes whatever case the frontend sends ("technical", "TECHNICAL",
      // "hr", etc.) into the exact casing the enum above expects, before
      // Mongoose runs its enum validation. Prevents the
      // "`technical` is not a valid enum value" crash.
      set: (value) => {
        if (!value) return value;
        const normalized = value.trim().toLowerCase();
        if (normalized === "technical") return "Technical";
        if (normalized === "hr") return "HR";
        return value;
      },
    },
    resumeText: {
      type: String,
    },
    questions: [questionsSchema],
    status: {
      type: String,
      enum: ["Incompleted", "completed"],
      default: "Incompleted",
    },
  },
  { timestamps: true }
);

const Interview = mongoose.model("Interview", interviewSchema);

export default Interview;