import express from "express";
import { Bike } from "../models/Bike.js";
import { User } from "../models/User.js";
import { Rental } from "../models/Rental.js";
import { Problem } from "../models/Problem.js";
import { requireAdmin } from "../middleware/authAdmin.js";

const router = express.Router();

// GET /api/admin/stats - Get dashboard statistics
router.get("/", requireAdmin, async (req, res) => {
  try {
    // Get counts
    const totalBikes = await Bike.countDocuments();
    const totalProblems = await Problem.countDocuments();
    const totalUsers = await User.countDocuments();
    const activeRentals = await Rental.countDocuments({ status: "active" });

    // Get recent rentals (last 10)
    const recentRentals = await Rental.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("user", "firstName lastName email")
      .populate("bike", "name type")
      .lean();

    // Get rental statistics for charts
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Bikes by type
    const bikesByType = await Bike.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get month parameter from query (0 = current month, 1-6 = previous months)
    const monthOffset = parseInt(req.query.monthOffset || "0", 10);
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0, 23, 59, 59);
    
    // Rentals in current month (daily)
    const rentalsCurrentMonthRaw = await Rental.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Create a map for quick lookup
    const rentalsMap = new Map();
    rentalsCurrentMonthRaw.forEach((item) => {
      rentalsMap.set(item._id, item.count);
    });

    // Generate all days in the month with 0 for days without rentals
    const rentalsCurrentMonth = [];
    const daysInMonth = endOfCurrentMonth.getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(startOfCurrentMonth.getFullYear(), startOfCurrentMonth.getMonth(), day);
      const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD format
      rentalsCurrentMonth.push({
        _id: dateStr,
        count: rentalsMap.get(dateStr) || 0,
      });
    }

    // Revenue in current month (daily)
    const revenueCurrentMonth = await Rental.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
          status: "completed",
          totalCost: { $exists: true },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$totalCost" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
    
    // Rentals by month (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const rentalsByMonth = await Rental.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
    
    // Revenue by month (last 6 months)
    const revenueByMonth = await Rental.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          status: "completed",
          totalCost: { $exists: true },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$createdAt" },
          },
          revenue: { $sum: "$totalCost" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Bikes by status
    const bikesByStatus = await Bike.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Problems by status
    const problemsByStatus = await Problem.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Total revenue (all time)
    const totalRevenueResult = await Rental.aggregate([
      {
        $match: {
          status: "completed",
          totalCost: { $exists: true },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalCost" },
        },
      },
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // Average rental duration (completed rentals)
    const avgDurationResult = await Rental.aggregate([
      {
        $match: {
          status: "completed",
          startTime: { $exists: true },
          endTime: { $exists: true },
        },
      },
      {
        $project: {
          duration: {
            $subtract: ["$endTime", "$startTime"],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: "$duration" },
        },
      },
    ]);
    const avgDurationMinutes =
      avgDurationResult[0]?.avgDuration
        ? avgDurationResult[0].avgDuration / (1000 * 60)
        : 0;

    res.json({
      counts: {
        bikes: totalBikes,
        problems: totalProblems,
        users: totalUsers,
        activeRentals: activeRentals,
      },
      recentRentals: recentRentals,
      charts: {
        bikesByType: bikesByType,
        rentalsCurrentMonth: rentalsCurrentMonth,
        revenueCurrentMonth: revenueCurrentMonth,
        rentalsByMonth: rentalsByMonth,
        revenueByMonth: revenueByMonth,
        bikesByStatus: bikesByStatus,
        problemsByStatus: problemsByStatus,
      },
      stats: {
        totalRevenue: totalRevenue,
        avgRentalDurationMinutes: Math.round(avgDurationMinutes),
        currentMonth: startOfCurrentMonth.toISOString().substring(0, 7),
      },
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
