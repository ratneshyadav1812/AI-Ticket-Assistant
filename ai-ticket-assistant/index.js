import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { serve } from "inngest/express";
import mongoose from "mongoose";
import { z } from "zod";
import { inngest } from "./inngest/client.js";
import { onUserSignup } from "./inngest/functions/on-signup.js";
import { onTicketCreated } from "./inngest/functions/on-ticket-create.js";
import ticketRoutes from "./routes/ticket.js";
import userRoutes from "./routes/user.js";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  GROQ_API_KEY: z.string().min(1),
  CLIENT_ORIGINS: z.string().default("http://localhost:5173"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]).default("lax"),
});

const envResult = envSchema.safeParse(process.env);
if (!envResult.success) {
  console.error(
    "Invalid environment configuration:",
    envResult.error.issues.map((issue) => issue.path.join(".")).join(", ")
  );
  process.exit(1);
}

const { PORT, MONGO_URI, CLIENT_ORIGINS } = envResult.data;
const allowedOrigins = CLIENT_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
app.disable("x-powered-by");

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin is not allowed by CORS"));
    },
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "64kb" }));

app.get("/api/health", (_req, res) =>
  res.status(200).json({ status: "ok" })
);
app.use("/api/auth", userRoutes);
app.use("/api/tickets", ticketRoutes);
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: [onUserSignup, onTicketCreated],
  })
);

app.use((_req, res) => res.status(404).json({ message: "Route not found" }));
app.use((error, _req, res, _next) => {
  console.error("Unhandled request error", error.message);
  res.status(500).json({ message: "Internal server error" });
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () =>
      console.log(`Server listening at http://localhost:${PORT}`)
    );
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exitCode = 1;
  });
