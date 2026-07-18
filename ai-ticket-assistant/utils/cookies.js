import crypto from "node:crypto";

export const ACCESS_TOKEN_COOKIE = "accessToken";
export const CSRF_TOKEN_COOKIE = "csrfToken";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const cookieSecurityOptions = () => {
  const sameSite = process.env.COOKIE_SAME_SITE || "lax";
  const secure = process.env.NODE_ENV === "production" || sameSite === "none";

  return {
    secure,
    sameSite,
    path: "/",
  };
};

const persistentCookieOptions = () => ({
  ...cookieSecurityOptions(),
  httpOnly: true,
  maxAge: FIFTEEN_MINUTES,
});

const clearingCookieOptions = () => ({
  ...cookieSecurityOptions(),
  httpOnly: true,
});

export const createCsrfToken = () => crypto.randomBytes(32).toString("hex");

export const setAuthenticationCookies = (res, accessToken) => {
  const csrfToken = createCsrfToken();

  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, persistentCookieOptions());
  res.cookie(CSRF_TOKEN_COOKIE, csrfToken, persistentCookieOptions());

  return csrfToken;
};

export const getOrCreateCsrfToken = (req, res) => {
  const existingToken = req.cookies?.[CSRF_TOKEN_COOKIE];
  if (existingToken) return existingToken;

  const csrfToken = createCsrfToken();
  res.cookie(CSRF_TOKEN_COOKIE, csrfToken, persistentCookieOptions());
  return csrfToken;
};

export const clearAuthenticationCookies = (res) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, clearingCookieOptions());
  res.clearCookie(CSRF_TOKEN_COOKIE, clearingCookieOptions());
};

