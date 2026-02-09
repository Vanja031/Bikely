import express from "express";
import { User } from "../models/User.js";
import { requireUser } from "../middleware/authUser.js";

const router = express.Router();

// GET /api/user/profile - Get user profile
router.get("/", requireUser, async (req, res) => {
  try {
    const userId = req.user.sub;
    const user = await User.findById(userId).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/user/profile - Update user profile
router.put("/", requireUser, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { firstName, lastName, email, phone } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.passwordHash;
    res.json(userResponse);
  } catch (err) {
    console.error("Update profile error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
