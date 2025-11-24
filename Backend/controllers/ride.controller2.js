const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');
const mapService = require('../services/maps.service');
const { sendMessageToSocketId } = require('../socket');
const rideModel = require('../models/ride.model');


// controllers/ride.controller.js (createRide)
module.exports.createRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { pickup, destination, vehicleType } = req.body;

  try {
    // create ride in DB
    const ride = await rideService.createRide({ user: req.user._id, pickup, destination, vehicleType });

    // respond to client first (ride created)
    res.status(201).json(ride);

    // Now do the additional work to notify captains. Wrap in try/catch to avoid throwing after response.
    try {
      // Get coordinates for pickup. Make sure mapService function returns { lat, lng }.
      // If your map service function has a different name, replace it accordingly.
      const pickupCoordinates = await mapService.getAddressCoordinate(pickup);
      const lat = pickupCoordinates.lat ?? pickupCoordinates.latitude ?? pickupCoordinates.ltd; // try common variants

      const lng = pickupCoordinates.lng ?? pickupCoordinates.longitude ?? pickupCoordinates.lng;

      if (typeof lat === 'undefined' || typeof lng === 'undefined') {
        console.warn('createRide: pickup coordinates not found', pickupCoordinates);
        return;
      }

      // get captains nearby (2 km radius)
      const captainsInRadius = await mapService.getCaptainsInTheRadius(lat, lng, 2);

      // remove otp before sending, or set a blank if needed
      // (you had ride.otp = "" earlier — but don't mutate DB model unless intended)
      const rideWithUser = await rideModel.findOne({ _id: ride._id }).populate('user');

      if (!captainsInRadius || !Array.isArray(captainsInRadius) || captainsInRadius.length === 0) {
        console.log('No captains found in radius for ride', ride._id);
        return;
      }

      // notify each captain; use socketId if present, else fallback to room
      captainsInRadius.forEach((captain) => {
        const payload = { event: 'new-ride', data: rideWithUser };

        if (captain.socketId) {
          // send to specific socket id
          sendMessageToSocketId(captain.socketId, payload);
        } else if (captain._id) {
          // fallback: send to room driver:{id} — driver should join room at connect
          sendMessageToSocketId(null, { ...payload, room: `driver:${captain._id}` });
        } else {
          console.warn('Captain has no socketId or _id. Skipping notify.', captain);
        }
      });
    } catch (innerErr) {
      // log but do not crash request (response already sent)
      console.error('Error notifying captains after ride creation:', innerErr);
    }
  } catch (err) {
    console.log(err);
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
}

module.exports.confirmRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await rideService.confirmRide({ rideId, captain: req.captain });

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-confirmed',
            data: ride
        })

        return res.status(200).json(ride);
    } catch (err) {

        console.log(err);
        return res.status(500).json({ message: err.message });
    }
}

module.exports.startRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, otp } = req.query;

    try {
        const ride = await rideService.startRide({ rideId, otp, captain: req.captain });

        console.log(ride);

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-started',
            data: ride
        })

        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.endRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    const ride = await rideService.endRide({ rideId, captain: req.captain });

    sendMessageToSocketId(ride.user.socketId, {
      event: 'ride-ended',
      data: ride
    });

    return res.status(200).json(ride);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
