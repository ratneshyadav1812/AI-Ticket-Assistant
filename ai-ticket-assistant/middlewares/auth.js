import User from "../models/user.js";
import {
  ACCESS_TOKEN_COOKIE,
  clearAuthenticationCookies,
} from "../utils/cookies.js";
import { verifyAccessToken } from "../utils/token.js";

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.[ACCESS_TOKEN_COOKIE];

    if (!token) {
      clearAuthenticationCookies(res);
      return res.status(401).json({ message: "Authentication required" });
    }
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.sub).select(
      "_id email role skills activeTicketCount capacity isAvailable"
    );

    if (!user) {
      clearAuthenticationCookies(res);
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = user;
    next();
  } catch {
    clearAuthenticationCookies(res);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
};
