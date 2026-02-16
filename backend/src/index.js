import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import adminBikeRoutes from "./routes/adminBikeRoutes.js";
import adminParkingRoutes from "./routes/adminParkingRoutes.js";
import adminIssueRoutes from "./routes/adminIssueRoutes.js";
import adminRentalRoutes from "./routes/adminRentalRoutes.js";
import adminStatsRoutes from "./routes/adminStatsRoutes.js";
import userAuthRoutes from "./routes/userAuthRoutes.js";
import userBikeRoutes from "./routes/userBikeRoutes.js";
import userRentalRoutes from "./routes/userRentalRoutes.js";
import userNotificationRoutes from "./routes/userNotificationRoutes.js";
import userProfileRoutes from "./routes/userProfileRoutes.js";
import userParkingRoutes from "./routes/userParkingRoutes.js";
import userIssueRoutes from "./routes/userIssueRoutes.js";
import { Admin } from "./models/Admin.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
// mongorestore --db bikely dump-bikely/bikely
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/bikely";

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

// static serving for generated QR codes (optional, for future mobile/web usage)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const qrPublicDir = process.env.QR_PUBLIC_DIR || path.join(__dirname, "..", "storage");
app.use("/static", express.static(qrPublicDir));

// API routes
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/bikes", adminBikeRoutes);
app.use("/api/admin/parking", adminParkingRoutes);
app.use("/api/admin/rentals", adminRentalRoutes);
app.use("/api/admin/issues", adminIssueRoutes);
app.use("/api/admin/stats", adminStatsRoutes);
app.use("/api/user/auth", userAuthRoutes);
app.use("/api/user/bikes", userBikeRoutes);
app.use("/api/user/rentals", userRentalRoutes);
app.use("/api/user/notifications", userNotificationRoutes);
app.use("/api/user/profile", userProfileRoutes);
app.use("/api/user/parking", userParkingRoutes);
app.use("/api/user/issues", userIssueRoutes);

// Health check / basic route
app.get("/", (req, res) => {
  res.json({ message: "Bikely backend is running 🚲" });
});

// Connect to MongoDB and start server
async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // ensure default admin exists (env-configurable)
    await Admin.createOrUpdateDefaultAdmin({
      email: process.env.ADMIN_EMAIL || "admin@bikely.local",
      password: process.env.ADMIN_PASSWORD || "admin123",
      name: process.env.ADMIN_NAME || "Bikely Admin",
    });
    console.log("Default admin ensured");

    app.listen(PORT, () => {
      console.log(`Bikely backend listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();

