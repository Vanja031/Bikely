import express from "express";
import { Bike } from "../models/Bike.js";
import { requireUser } from "../middleware/authUser.js";

const router = express.Router();

// GET /api/user/bikes - Get all available bikes
router.get("/", requireUser, async (req, res) => {
  try {
    const bikes = await Bike.find({ status: "available" }).select(
      "-qrCodePath"
    );
    res.json(bikes);
  } catch (err) {
    console.error("List bikes error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/user/bikes/:id - Get bike details
router.get("/:id", requireUser, async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id).select("-qrCodePath");
    if (!bike) {
      return res.status(404).json({ error: "Bike not found" });
    }
    res.json(bike);
  } catch (err) {
    console.error("Get bike error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
