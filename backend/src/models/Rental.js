import mongoose from "mongoose";

const rentalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bike: { type: mongoose.Schema.Types.ObjectId, ref: "Bike", required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    startLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    endLocation: {
      lat: { type: Number },
      lng: { type: Number },
    },
    totalCost: { type: Number },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    endPhoto: { type: String }, // URL to photo
  },
  { timestamps: true }
);

export const Rental = mongoose.model("Rental", rentalSchema);
