import express from "express";
import { ParkingSpot } from "../models/ParkingSpot.js";
import { requireAdmin } from "../middleware/authAdmin.js";

const router = express.Router();

// GET /api/admin/parking
router.get("/", requireAdmin, async (req, res) => {
  try {
    const spots = await ParkingSpot.find().sort({ createdAt: -1 });
    res.json(spots);
  } catch (err) {
    console.error("List parking spots error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/parking
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, location } = req.body;
    if (!name || !location?.lat || !location?.lng) {
      return res.status(400).json({ error: "Nedostaju naziv ili lokacija (lat, lng)" });
    }

    const spot = await ParkingSpot.create({
      name,
      location: { lat: location.lat, lng: location.lng },
    });

    res.status(201).json(spot);
  } catch (err) {
    console.error("Create parking spot error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/parking/:id
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const spot = await ParkingSpot.findByIdAndDelete(id);
    if (!spot) {
      return res.status(404).json({ error: "Parking mesto nije pronađeno" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Delete parking spot error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
