import bcrypt from "bcrypt";
import User from "../models/user.js";
import { inngest } from "../inngest/client.js";
import {
  clearAuthenticationCookies,
  getOrCreateCsrfToken,
  setAuthenticationCookies,
} from "../utils/cookies.js";
import { signAccessToken } from "../utils/token.js";

const toSafeUser = (user) => ({
  _id: user._id,
  email: user.email,
  role: user.role,
  skills: user.skills,
  activeTicketCount: user.activeTicketCount,
  capacity: user.capacity,
  isAvailable: user.isAvailable,
});

export const signup = async (req, res) => {
  const { email, password, skills } = req.validatedBody;

  try {
    const existingUser = await User.exists({ email });
    if (existingUser) {
      return res.status(409).json({ message: "An account already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      skills,
      role: "user",
    });

    // await inngest.send({
    //   name: "user/signup",
    //   data: { email: user.email },
    // });

    const csrfToken = setAuthenticationCookies(res, signAccessToken(user));

    return res.status(201).json({
      user: toSafeUser(user),
      csrfToken,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "An account already exists" });
    }

    console.error("Signup failed", error.message);
    return res.status(500).json({ message: "Signup failed" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.validatedBody;

  try {
    const user = await User.findOne({ email }).select("+password");
    const passwordMatches = user
      ? await bcrypt.compare(password, user.password)
      : false;

    if (!user || !passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const csrfToken = setAuthenticationCookies(res, signAccessToken(user));

    return res.status(200).json({
      user: toSafeUser(user),
      csrfToken,
    });
  } catch (error) {
    console.error("Login failed", error.message);
    return res.status(500).json({ message: "Login failed" });
  }
};

export const logout = async (_req, res) => {
  clearAuthenticationCookies(res);
  return res.status(200).json({ message: "Logged out successfully" });
};

export const getMe = async (req, res) => {
  const csrfToken = getOrCreateCsrfToken(req, res);
  return res.status(200).json({ user: toSafeUser(req.user), csrfToken });
};

export const updateUser = async (req, res) => {
  const { skills, role, email, capacity, isAvailable } = req.validatedBody;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin" && role !== "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(409).json({
          message: "The last administrator cannot be demoted",
        });
      }
    }

    user.role = role;
    user.skills = skills;
    if (capacity !== undefined) user.capacity = capacity;
    if (isAvailable !== undefined) user.isAvailable = isAvailable;
    await user.save();

    return res.status(200).json({
      message: "User updated successfully",
      user: toSafeUser(user),
    });
  } catch (error) {
    console.error("User update failed", error.message);
    return res.status(500).json({ message: "User update failed" });
  }
};

export const getUsers = async (_req, res) => {
  try {
    const users = await User.find()
      .select(
        "_id email role skills activeTicketCount capacity isAvailable createdAt"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json(users);
  } catch (error) {
    console.error("Fetching users failed", error.message);
    return res.status(500).json({ message: "Fetching users failed" });
  }
};
