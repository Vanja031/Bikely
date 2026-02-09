import express from "express";
import path from "path";
import fs from "fs";
import QRCode from "qrcode";
import { Bike } from "../models/Bike.js";
import { requireAdmin } from "../middleware/authAdmin.js";

const router = express.Router();

// ensure storage directory exists
const QR_DIR = process.env.QR_DIR || path.join(process.cwd(), "storage", "qrcodes");
fs.mkdirSync(QR_DIR, { recursive: true });

// Helper to generate QR code PNG for a bike
async function generateBikeQrCode(bike) {
  const qrData = JSON.stringify({
    bikeId: bike._id.toString(),
  });

  const fileName = `bike-${bike._id}.png`;
  const filePath = path.join(QR_DIR, fileName);

  await QRCode.toFile(filePath, qrData, {
    type: "png",
    width: 512,
  });

  return filePath;
}

// GET /api/admin/bikes
router.get("/", requireAdmin, async (req, res) => {
  try {
    const bikes = await Bike.find().sort({ createdAt: -1 });
    res.json(bikes);
  } catch (err) {
    console.error("List bikes error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/bikes
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, type, hourlyRate, status, location } = req.body;
    if (!name || !type || !hourlyRate || !location?.lat || !location?.lng) {
      return res.status(400).json({ error: "Missing required bike fields" });
    }

    const bike = await Bike.create({
      name,
      type,
      hourlyRate,
      status: status || "available",
      location,
    });

    const qrCodePath = await generateBikeQrCode(bike);
    bike.qrCodePath = qrCodePath;
    await bike.save();

    res.status(201).json(bike);
  } catch (err) {
    console.error("Create bike error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/admin/bikes/:id
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, hourlyRate, status, location } = req.body;

    const bike = await Bike.findById(id);
    if (!bike) {
      return res.status(404).json({ error: "Bike not found" });
    }

    if (name !== undefined) bike.name = name;
    if (type !== undefined) bike.type = type;
    if (hourlyRate !== undefined) bike.hourlyRate = hourlyRate;
    if (status !== undefined) bike.status = status;
    if (location?.lat !== undefined && location?.lng !== undefined) {
      bike.location = location;
    }

    await bike.save();
    res.json(bike);
  } catch (err) {
    console.error("Update bike error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/bikes/:id (soft delete -> inactive)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const bike = await Bike.findById(id);
    if (!bike) {
      return res.status(404).json({ error: "Bike not found" });
    }
    bike.status = "inactive";
    await bike.save();
    res.json({ success: true });
  } catch (err) {
    console.error("Delete bike error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

