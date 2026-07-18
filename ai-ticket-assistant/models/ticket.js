import mongoose from "mongoose";
import { normalizeSkills } from "../utils/skills.js";

export const TICKET_STATUSES = [
  "TODO",
  "PROCESSING",
  "WAITING_FOR_ASSIGNMENT",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "AI_ANALYSIS_FAILED",
  "FAILED",
];

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 10000,
    },
    summary: {
      type: String,
      default: "",
      maxlength: 300,
    },
    status: {
      type: String,
      enum: TICKET_STATUSES,
      default: "TODO",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: null,
    },
    deadline: {
      type: Date,
      default: null,
    },
    helpfulNotes: {
      type: String,
      default: "",
      maxlength: 5000,
    },
    relatedSkills: {
      type: [String],
      default: [],
      set: normalizeSkills,
    },
    processingAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    processingStage: {
      type: String,
      enum: [
        "QUEUED",
        "AI_ANALYSIS",
        "ASSIGNMENT",
        "NOTIFICATION",
        "COMPLETED",
        "FAILED",
      ],
      default: "QUEUED",
    },
    processingError: {
      type: String,
      default: "",
      maxlength: 1000,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

ticketSchema.index({ createdBy: 1, createdAt: -1 });
ticketSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });

export default mongoose.model("Ticket", ticketSchema);
