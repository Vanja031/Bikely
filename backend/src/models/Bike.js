import mongoose from "mongoose";

const bikeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true }, // city, mtb, electric...
    hourlyRate: { type: Number, required: true },
    status: {
      type: String,
      enum: ["available", "in_use", "maintenance", "inactive"],
      default: "available",
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    qrCodePath: { type: String }, // local file path to generated QR code image
  },
  { timestamps: true }
);

export const Bike = mongoose.model("Bike", bikeSchema);

