const mapsService = require("../services/maps.service");
const {validationResult} = require("express-validator");
const axios = require("axios");


module.exports.getCoordinates = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    const coordinates = await mapsService.getCoordinates(address);
    res.status(200).json(coordinates);
  } catch (error) {
    console.error("Error in getCoordinates:", error.message);
    res.status(404).json({ error: "Coordinates not found" });
  }
};

module.exports.getDistanceTime = async (req, res, next) => {

    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { origin, destination } = req.query;

        const distanceTime = await mapsService.getDistanceTime(origin, destination);

        res.status(200).json(distanceTime);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
}
  module.exports.getAutoCompleteSuggestions = async (req, res, next) => {

    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { input } = req.query;

        const suggestions = await mapsService.getAutoCompleteSuggestions(input);

        res.status(200).json(suggestions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
}
