import crypto from "node:crypto";
import { CSRF_TOKEN_COOKIE } from "../utils/cookies.js";

const safelyEqual = (left, right) => {
  if (typeof left !== "string" || typeof right !== "string") return false;

  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
};

export const csrfProtection = (req, res, next) => {
  const cookieToken = req.cookies?.[CSRF_TOKEN_COOKIE];
  const headerToken = req.get("x-csrf-token");

  if (!safelyEqual(cookieToken, headerToken)) {
    return res.status(403).json({ message: "Invalid CSRF token" });
  }

  next();
};

