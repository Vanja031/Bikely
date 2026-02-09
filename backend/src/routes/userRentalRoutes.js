import express from "express";
import path from "path";
import fs from "fs";
import { Rental } from "../models/Rental.js";
import { Bike } from "../models/Bike.js";
import { Notification } from "../models/Notification.js";
import { ParkingSpot } from "../models/ParkingSpot.js";
import { requireUser } from "../middleware/authUser.js";

const router = express.Router();

/** Udaljenost između dve tačke (lat/lng) u metrima – Haversine. */
function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Zemljin poluprečnik u m
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const PARKING_RADIUS_METERS = 100;

// Ensure rental photos directory exists
const PHOTOS_DIR = process.env.RENTAL_PHOTOS_DIR || path.join(process.cwd(), "storage", "rental-photos");
fs.mkdirSync(PHOTOS_DIR, { recursive: true });

/** Sačuvaj base64 sliku kao fajl i vrati relativnu putanju */
function saveRentalPhoto(rentalId, base64Data) {
  if (!base64Data) return null;
  
  // Ukloni data URL prefix ako postoji (data:image/jpeg;base64,...)
  const base64Match = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!base64Match) return null;
  
  const [, imageType, base64Content] = base64Match;
  const extension = imageType === "jpeg" || imageType === "jpg" ? "jpg" : "png";
  const fileName = `rental-${rentalId}.${extension}`;
  const filePath = path.join(PHOTOS_DIR, fileName);
  
  // Konvertuj base64 u buffer i sačuvaj
  const buffer = Buffer.from(base64Content, "base64");
  fs.writeFileSync(filePath, buffer);
  
  // Vrati relativnu putanju (portabilna - radi na svakom računaru)
  return `rental-photos/${fileName}`;
}

// POST /api/user/rentals/start - Start a rental
router.post("/start", requireUser, async (req, res) => {
  try {
    const { bikeId, qrCode, startLocation } = req.body;
    const userId = req.user.sub;

    if (!bikeId || !qrCode || !startLocation?.lat || !startLocation?.lng) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify bike exists and is available
    const bike = await Bike.findById(bikeId);
    if (!bike) {
      return res.status(404).json({ error: "Bike not found" });
    }

    if (bike.status !== "available") {
      return res.status(400).json({ error: "Bike is not available" });
    }

    // Verify QR code matches bike ID
    if (qrCode !== bikeId) {
      return res.status(400).json({ error: "Invalid QR code" });
    }

    // Check if user has active rental
    const activeRental = await Rental.findOne({
      user: userId,
      status: "active",
    });

    if (activeRental) {
      return res.status(400).json({ error: "You already have an active rental" });
    }

    // Create rental
    const rental = await Rental.create({
      user: userId,
      bike: bikeId,
      startTime: new Date(),
      startLocation: startLocation,
      status: "active",
    });

    // Update bike status
    bike.status = "in_use";
    await bike.save();

    // Create notification
    await Notification.create({
      user: userId,
      title: "Iznajmljivanje započeto",
      message: `Uspešno ste započeli iznajmljivanje bicikla ${bike.name}`,
      type: "success",
      relatedRental: rental._id,
    });

    res.status(201).json(rental);
  } catch (err) {
    console.error("Start rental error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/user/rentals/:id/end - End a rental
router.post("/:id/end", requireUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    // Prima samo endLocation i endPhoto - cena se računa na backendu
    const { endLocation, endPhoto } = req.body;

    const rental = await Rental.findOne({ _id: id, user: userId });

    if (!rental) {
      return res.status(404).json({ error: "Rental not found" });
    }

    if (rental.status !== "active") {
      return res.status(400).json({ error: "Rental is not active" });
    }

    if (!endLocation?.lat || !endLocation?.lng) {
      return res.status(400).json({
        error: "Lokacija završetka je obavezna. Dozvolite pristup lokaciji da biste završili iznajmljivanje.",
      });
    }

    const parkingSpots = await ParkingSpot.find();
    const nearParking = parkingSpots.some((spot) => {
      const d = distanceMeters(
        endLocation.lat,
        endLocation.lng,
        spot.location.lat,
        spot.location.lng
      );
      return d <= PARKING_RADIUS_METERS;
    });

    if (!nearParking) {
      return res.status(400).json({
        error: "Morate biti u blizini dozvoljenog parking mesta (do 100 m) da biste završili iznajmljivanje.",
      });
    }

    // Računaj cenu na osnovu startTime i endTime (cena se ne šalje sa frontenda)
    const endTime = new Date();
    // Osiguraj da je startTime Date objekat
    const startTime = rental.startTime instanceof Date ? rental.startTime : new Date(rental.startTime);
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    
    // Uzmi bike - proveri da li je već popunjen ili je ObjectId
    let bike;
    if (rental.bike && typeof rental.bike === 'object' && rental.bike.hourlyRate !== undefined) {
      // Već je popunjen objekat
      bike = rental.bike;
    } else {
      // Treba da se učita iz baze
      bike = await Bike.findById(rental.bike);
    }
    
    if (!bike) {
      return res.status(404).json({ error: "Bike not found for this rental" });
    }
    
    if (!bike.hourlyRate || bike.hourlyRate <= 0) {
      return res.status(400).json({ error: "Invalid bike hourly rate" });
    }
    
    // Računaj tačnu cenu na osnovu stvarnog trajanja (bez zaokruživanja)
    const billedHours = Math.max(0, durationHours); // Osiguraj samo da nije negativno
    const totalCost = billedHours * bike.hourlyRate;
    
    // Validacija da totalCost nije NaN ili undefined
    if (isNaN(totalCost) || totalCost < 0) {
      return res.status(500).json({ error: "Greška pri računanju cene iznajmljivanja" });
    }

    // Sačuvaj sliku lokalno ako je poslata
    const photoPath = endPhoto ? saveRentalPhoto(rental._id.toString(), endPhoto) : null;

    rental.endTime = endTime;
    rental.endLocation = endLocation;
    rental.endPhoto = photoPath; // Relativna putanja umesto base64
    rental.totalCost = totalCost;
    rental.status = "completed";
    await rental.save();

    // Update bike status
    bike.status = "available";
    bike.location = endLocation || rental.startLocation;
    await bike.save();

    // Create notification
    await Notification.create({
      user: userId,
      title: "Iznajmljivanje završeno",
      message: `Iznajmljivanje završeno. Ukupna cena: ${totalCost} RSD`,
      type: "success",
      relatedRental: rental._id,
    });

    // Osveži rental objekat da bismo dobili najnovije vrednosti
    await rental.populate('bike', 'name type hourlyRate');
    
    // Vrati rental sa totalCost (osiguraj da je uvek prisutan i tačan)
    const responseData = {
      ...rental.toObject(),
      totalCost: totalCost, // Koristi izračunatu vrednost, ne iz baze (osigurava tačnost)
    };
        
    res.json(responseData);
  } catch (err) {
    console.error("End rental error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/user/rentals - Get user's rentals
router.get("/", requireUser, async (req, res) => {
  try {
    const userId = req.user.sub;
    const rentals = await Rental.find({ user: userId })
      .populate("bike", "name type hourlyRate")
      .sort({ createdAt: -1 });
    res.json(rentals);
  } catch (err) {
    console.error("Get rentals error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/user/rentals/active - Get active rental
router.get("/active", requireUser, async (req, res) => {
  try {
    const userId = req.user.sub;
    const rental = await Rental.findOne({ user: userId, status: "active" })
      .populate("bike", "name type hourlyRate");
    res.json(rental || null);
  } catch (err) {
    console.error("Get active rental error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
