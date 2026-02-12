import express from "express";
import path from "path";
import fs from "fs";
import { requireUser } from "../middleware/authUser.js";
import { Problem } from "../models/Problem.js";
import { Bike } from "../models/Bike.js";

const router = express.Router();

// Directory for storing uploaded problem photos
const PROBLEM_PHOTOS_DIR =
  process.env.PROBLEM_PHOTOS_DIR ||
  path.join(process.cwd(), "storage", "problem-photos");
fs.mkdirSync(PROBLEM_PHOTOS_DIR, { recursive: true });

function saveProblemPhoto(problemId, index, base64Data) {
  if (!base64Data) return null;
  const match = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) return null;
  const [, imageType, base64Content] = match;
  const extension =
    imageType === "jpeg" || imageType === "jpg" ? "jpg" : "png";
  const fileName = `problem-${problemId}-${index}.${extension}`;
  const filePath = path.join(PROBLEM_PHOTOS_DIR, fileName);
  const buffer = Buffer.from(base64Content, "base64");
  fs.writeFileSync(filePath, buffer);
  return `problem-photos/${fileName}`;
}

// POST /api/user/issues - Create a new problem report
router.post("/", requireUser, async (req, res) => {
  try {
    const userId = req.user.sub;
    const {
      bikeId,
      rentalId,
      title,
      type,
      address,
      description,
      photos = [],
    } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ error: "Naziv i opis problema su obavezni." });
    }

    let bike = null;
    let location = undefined;

    if (bikeId) {
      bike = await Bike.findById(bikeId);
      if (!bike) {
        return res.status(404).json({ error: "Bicikl nije pronađen." });
      }
      if (bike.location?.lat != null && bike.location?.lng != null) {
        location = {
          lat: bike.location.lat,
          lng: bike.location.lng,
        };
      }
    }

    const problem = await Problem.create({
      user: userId,
      bike: bike?._id,
      rental: rentalId || undefined,
      title,
      type: type || "bike",
      address: address || undefined,
      location,
      description,
      photos: [],
      status: "open",
    });

    const storedPhotos = [];
    photos.forEach((p, idx) => {
      const relPath = saveProblemPhoto(problem._id.toString(), idx, p);
      if (relPath) storedPhotos.push(relPath);
    });

    if (storedPhotos.length > 0) {
      problem.photos = storedPhotos;
      await problem.save();
    }

    res.status(201).json(problem);
  } catch (err) {
    console.error("Create problem error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/user/issues - list current user's problems (optional helper)
router.get("/", requireUser, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { status } = req.query;
    const query = { user: userId };
    if (status && ["open", "in_progress", "resolved"].includes(status)) {
      query.status = status;
    }
    const problems = await Problem.find(query)
      .populate("bike", "name type")
      .sort({ createdAt: -1 });
    res.json(problems);
  } catch (err) {
    console.error("List user problems error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

