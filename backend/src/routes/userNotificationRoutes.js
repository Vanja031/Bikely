import express from "express";
import { Notification } from "../models/Notification.js";
import { requireUser } from "../middleware/authUser.js";

const router = express.Router();

// GET /api/user/notifications - Get user's notifications
router.get("/", requireUser, async (req, res) => {
  try {
    const userId = req.user.sub;
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/user/notifications/unread-count - Get unread count
router.get("/unread-count", requireUser, async (req, res) => {
  try {
    const userId = req.user.sub;
    const count = await Notification.countDocuments({
      user: userId,
      read: false,
    });
    res.json({ count });
  } catch (err) {
    console.error("Get unread count error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/user/notifications/:id/read - Mark notification as read
router.put("/:id/read", requireUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;

    const notification = await Notification.findOne({
      _id: id,
      user: userId,
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
  } catch (err) {
    console.error("Mark notification read error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/user/notifications/read-all - Mark all as read
router.put("/read-all", requireUser, async (req, res) => {
  try {
    const userId = req.user.sub;
    await Notification.updateMany(
      { user: userId, read: false },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Mark all read error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
