import express from "express";
import { ParkingSpot } from "../models/ParkingSpot.js";
import { requireUser } from "../middleware/authUser.js";

const router = express.Router();

// GET /api/user/parking - Lista parking mesta (za mapu)
router.get("/", requireUser, async (req, res) => {
  try {
    const spots = await ParkingSpot.find().sort({ name: 1 });
    res.json(spots);
  } catch (err) {
    console.error("List parking spots error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
