import mongoose from "mongoose";
import { normalizeSkills } from "../utils/skills.js";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "moderator", "admin"],
    },
    skills: {
      type: [String],
      default: [],
      set: normalizeSkills,
    },
    activeTicketCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    capacity: {
      type: Number,
      default: 5,
      min: 1,
      max: 100,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    lastAssignedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, isAvailable: 1, activeTicketCount: 1 });

export default mongoose.model("User", userSchema);

