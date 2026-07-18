import { z } from "zod";
import { normalizeSkills } from "../utils/skills.js";

const skillsSchema = z
  .array(z.string().trim().min(1).max(50))
  .max(20)
  .default([])
  .transform(normalizeSkills);

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(72),
  skills: skillsSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(72),
});

export const updateUserSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  role: z.enum(["user", "moderator", "admin"]),
  skills: skillsSchema,
  capacity: z.number().int().min(1).max(100).optional(),
  isAvailable: z.boolean().optional(),
});

export const createTicketSchema = z.object({
  title: z.string().trim().min(5).max(200),
  description: z.string().trim().min(10).max(10000),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(["IN_PROGRESS", "RESOLVED"]),
});

export const TicketAnalysisSchema = z.object({
  summary: z.string().trim().min(1).max(300),
  priority: z.enum(["low", "medium", "high"]),
  helpfulNotes: z.string().trim().min(1).max(5000),
  relatedSkills: z
    .array(z.string().trim().min(1).max(50))
    .max(10)
    .transform(normalizeSkills),
});
