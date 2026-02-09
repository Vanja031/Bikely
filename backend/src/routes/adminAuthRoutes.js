import express from "express";
import { Admin } from "../models/Admin.js";
import { signAdminToken } from "../middleware/authAdmin.js";

const router = express.Router();

// POST /api/admin/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await admin.verifyPassword(password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signAdminToken(admin);
    res.json({
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

