import mongoose from "mongoose";

const problemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bike: { type: mongoose.Schema.Types.ObjectId, ref: "Bike" },
    rental: { type: mongoose.Schema.Types.ObjectId, ref: "Rental" },

    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["bike", "parking", "app", "other"],
      default: "bike",
    },

    address: { type: String },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },

    description: { type: String, required: true },

    photos: [{ type: String }], // relative paths under /static

    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open",
    },
    resolutionNote: { type: String },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

export const Problem = mongoose.model("Problem", problemSchema);

