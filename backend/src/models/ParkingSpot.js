import mongoose from "mongoose";

const parkingSpotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

export const ParkingSpot = mongoose.model("ParkingSpot", parkingSpotSchema);
