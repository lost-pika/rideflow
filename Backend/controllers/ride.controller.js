const rideService = require("../services/ride.service");
const { validationResult } = require("express-validator");
const mapService = require("../services/maps.service");
const { sendMessage } = require("../socket");
const rideModel = require("../models/ride.model");

module.exports.createRide = async (req, res) => {
  console.log("\n" + "=".repeat(80));
  console.log("🚗 CREATE RIDE REQUEST RECEIVED");
  console.log("User ID:", req.user._id);
  console.log("Pickup:", req.body.pickup);
  console.log("Destination:", req.body.destination);
  console.log("Vehicle Type:", req.body.vehicleType);
  console.log("=".repeat(80));

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("❌ Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { pickup, destination, vehicleType } = req.body;

  try {
    // create ride in DB
    const ride = await rideService.createRide({
      user: req.user._id,
      pickup,
      destination,
      vehicleType,
    });

    console.log("✅ Ride created in DB with ID:", ride._id);

    // respond to client first (ride created)
    res.status(201).json(ride);

    // Now do the additional work to notify captains
    try {
      console.log("📍 Getting coordinates for pickup:", pickup);

      // Get coordinates
      const pickupCoordinates = await mapService.getCoordinates(pickup);
      console.log(
        "✅ Coordinates received:",
        JSON.stringify(pickupCoordinates)
      );

      // Normalize keys
      const lat = pickupCoordinates.lat ?? pickupCoordinates.latitude;
      const lng = pickupCoordinates.lng ?? pickupCoordinates.longitude;

      if (typeof lat === "undefined" || typeof lng === "undefined") {
        console.error("❌ INVALID COORDINATES!");
        console.error("   lat:", lat);
        console.error("   lng:", lng);
        console.error("   Raw response:", pickupCoordinates);
        return;
      }

      console.log(
        `🔍 Searching for captains near: lat=${lat}, lng=${lng}, radius=2km`
      );

      // const captainsInRadius = await mapService.getCaptainsInTheRadius(
      //   lat,
      //   lng,
      //   100
      // );

      // TO (for testing):
      const captainsInRadius = await mapService.getCaptainsInTheRadius(
        lat,
        lng,
        10000 // 10,000 km - should definitely find the captain
      );

      console.log("📊 CAPTAIN SEARCH RESULTS:");
      console.log(
        `   Total captains found: ${
          captainsInRadius ? captainsInRadius.length : 0
        }`
      );

      if (captainsInRadius && captainsInRadius.length > 0) {
        captainsInRadius.forEach((cap, idx) => {
          console.log(`   [${idx + 1}] Captain ${cap._id}:`);
          console.log(`       Email: ${cap.email}`);
          console.log(`       SocketId: ${cap.socketId || "❌ NOT SET"}`);
          console.log(`       Location: ${JSON.stringify(cap.location)}`);
        });
      }

      const rideWithUser = await rideModel.findById(ride._id).populate("user");
      console.log("✅ Ride populated with user data");

      if (!Array.isArray(captainsInRadius) || captainsInRadius.length === 0) {
        console.log("⚠️ NO CAPTAINS FOUND IN RADIUS");
        console.log("   Possible reasons:");
        console.log("   - No captains registered in database");
        console.log("   - All captains are > 2km away from pickup");
        console.log("   - Captains do not have location saved");
        console.log("   - Geospatial index not created");
        console.log("\n   💡 Try: Increase radius to 20km for testing");
        console.log("   💡 Try: db.captains.find() to check captain data");
        return;
      }

      let successCount = 0;
      let failCount = 0;

      captainsInRadius.forEach((captain) => {
        const payload = { event: "new-ride", data: rideWithUser };

        if (captain.socketId) {
          console.log(`📤 Sending 'new-ride' to captain ${captain._id}`);
          console.log(`   Socket ID: ${captain.socketId}`);

          sendMessage({
            socketId: captain.socketId,
            event: payload.event,
            data: payload.data,
          });
          successCount++;
        } else {
          console.log(
            `⚠️ Captain ${captain._id} has NO socketId - trying room fallback`
          );

          sendMessage({
            room: `captain:${captain._id}`,
            event: payload.event,
            data: payload.data,
          });
          failCount++;
        }
      });

      console.log("\n📊 NOTIFICATION SUMMARY:");
      console.log(`   ✅ Sent to ${successCount} captain(s) via socketId`);
      console.log(
        `   ⚠️ Sent to ${failCount} captain(s) via room (no socketId)`
      );
      console.log("=".repeat(80) + "\n");
    } catch (notifyErr) {
      console.error("❌ ERROR in captain notification:");
      console.error("   Message:", notifyErr.message);
      console.error("   Stack:", notifyErr.stack);
    }
  } catch (err) {
    console.error("❌ ERROR creating ride:", err.message);
    console.error("   Stack:", err.stack);
    return res.status(500).json({ message: err.message });
  }
};

module.exports.getFare = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { pickup, destination } = req.query;

  try {
    const fare = await rideService.getFare(pickup, destination);
    return res.status(200).json(fare);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.confirmRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    const ride = await rideService.confirmRide({
      rideId,
      captain: req.captain,
    });

    sendMessage({
      socketId: ride.user.socketId,
      event: "ride-confirmed",
      data: ride,
    });

    return res.status(200).json(ride);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports.startRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId, otp } = req.query;

  try {
    const ride = await rideService.startRide({
      rideId,
      otp,
      captain: req.captain,
    });

    sendMessage({
      socketId: ride.user.socketId,
      event: "ride-started",
      data: ride,
    });

    return res.status(200).json(ride);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.endRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    const ride = await rideService.endRide({ rideId, captain: req.captain });

    sendMessage({
      socketId: ride.user.socketId,
      event: "ride-ended",
      data: ride,
    });

    return res.status(200).json(ride);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
