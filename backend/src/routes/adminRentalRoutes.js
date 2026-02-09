import express from "express";
import { Rental } from "../models/Rental.js";
import { requireAdmin } from "../middleware/authAdmin.js";

const router = express.Router();

// GET /api/admin/rentals - List all rentals (admin)
router.get("/", requireAdmin, async (req, res) => {
  try {
    const rentals = await Rental.find()
      .populate("user", "email firstName lastName phone")
      .populate("bike", "name type hourlyRate")
      .sort({ startTime: -1 });
    res.json(rentals);
  } catch (err) {
    console.error("Admin list rentals error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/rentals/:id - Get rental details (admin)
router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id)
      .populate("user", "email firstName lastName phone")
      .populate("bike", "name type hourlyRate");
    
    if (!rental) {
      return res.status(404).json({ error: "Rental not found" });
    }
    
    res.json(rental);
  } catch (err) {
    console.error("Admin get rental details error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
