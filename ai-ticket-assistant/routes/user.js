import express from "express";
import {
  getMe,
  getUsers,
  login,
  logout,
  signup,
  updateUser,
} from "../controllers/user.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import { csrfProtection } from "../middlewares/csrf.js";
import { validateBody } from "../middlewares/validate.js";
import {
  loginSchema,
  signupSchema,
  updateUserSchema,
} from "../validation/schemas.js";

const router = express.Router();

router.post("/signup", validateBody(signupSchema), signup);
router.post("/login", validateBody(loginSchema), login);
router.post("/logout", csrfProtection, logout);
router.get("/me", authenticate, getMe);

router.get("/users", authenticate, authorize("admin"), getUsers);
router.post(
  "/update-user",
  authenticate,
  authorize("admin"),
  csrfProtection,
  validateBody(updateUserSchema),
  updateUser
);

export default router;
