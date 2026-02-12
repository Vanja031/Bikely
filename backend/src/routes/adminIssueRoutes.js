import express from "express";
import { requireAdmin } from "../middleware/authAdmin.js";
import { Problem } from "../models/Problem.js";
import { Bike } from "../models/Bike.js";

const router = express.Router();

// GET /api/admin/issues - list all problem reports
router.get("/", requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && ["open", "resolved"].includes(status)) {
      query.status = status;
    }
    const problems = await Problem.find(query)
      .populate("user", "email firstName lastName phone")
      .populate("bike", "name type")
      .sort({ createdAt: -1 });
    res.json(problems);
  } catch (err) {
    console.error("Admin list problems error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/issues/unresolved-count - number of open problems
router.get("/unresolved-count", requireAdmin, async (req, res) => {
  try {
    const count = await Problem.countDocuments({
      status: "open",
    });
    res.json({ count });
  } catch (err) {
    console.error("Admin unresolved problems count error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/admin/issues/:id/status - mark problem as resolved with bike action
router.put("/:id/status", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, resolutionNote } = req.body;

    // action: "resolve" | "maintenance" | "deactivate"
    if (!["resolve", "maintenance", "deactivate"].includes(action)) {
      return res
        .status(400)
        .json({ error: "Nevažeća akcija. Dozvoljene: resolve, maintenance, deactivate" });
    }

    const problem = await Problem.findById(id);
    if (!problem) {
      return res.status(404).json({ error: "Prijava nije pronađena." });
    }

    // Ažuriraj status problema na resolved
    problem.status = "resolved";
    if (resolutionNote != null) {
      problem.resolutionNote = resolutionNote;
    }
    problem.resolvedAt = new Date();
    problem.resolvedBy = req.admin.sub;

    // Ažuriraj status bicikla na osnovu akcije
    if (problem.bike) {
      let bikeId;
      if (typeof problem.bike === "object" && problem.bike._id) {
        bikeId = problem.bike._id;
      } else {
        bikeId = problem.bike;
      }
      
      const bike = await Bike.findById(bikeId);
      if (bike) {
        if (action === "maintenance") {
          bike.status = "maintenance";
        } else if (action === "deactivate") {
          bike.status = "inactive";
        } else if (action === "resolve") {
          bike.status = "available";
        }
        await bike.save();
      }
    }

    await problem.save();
    res.json(problem);
  } catch (err) {
    console.error("Admin update problem status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

