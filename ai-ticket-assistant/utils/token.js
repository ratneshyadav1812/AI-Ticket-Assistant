import jwt from "jsonwebtoken";

export const JWT_ISSUER = "ticket-management-api";
export const JWT_AUDIENCE = "ticket-management-client";

export const signAccessToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }
  );

export const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });

