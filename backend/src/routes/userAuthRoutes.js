import express from "express";
import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { signUserToken } from "../middleware/authUser.js";

const router = express.Router();

// POST /api/user/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, password, email, firstName, lastName, phone } = req.body;

    if (!username || !password || !email || !firstName || !lastName || !phone) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({ error: "Username or email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      passwordHash,
      email,
      firstName,
      lastName,
      phone,
    });

    // Create welcome notification
    await Notification.create({
      user: user._id,
      title: "Dobrodošli u Bikely",
      message: "Hvala što ste se registrovali. Uživajte u vožnji!",
      type: "info",
    });

    const token = signUserToken(user);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("User registration error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ error: "Username or email already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/user/auth/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await user.verifyPassword(password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signUserToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("User login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
