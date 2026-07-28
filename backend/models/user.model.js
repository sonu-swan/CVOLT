import mongoose from "mongoose";

const userScheme = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },

    credits: {
      type: Number,
      default: 100,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("user", userScheme);

export default User;
