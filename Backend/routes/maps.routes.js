const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const mapController = require("../controllers/maps.controller");
// const getCoordinates = require('../controllers/maps.controller')
const { query } = require("express-validator");

router.get(
  "/get-coordinates",
  query("address").isString().isLength({ min: 3 }),
  authMiddleware.authUser,
  mapController.getCoordinates
); // ye jo particular route hai ye ek api use kar rha hai and jab isko production pe le jaoge to aaapko paise dene padte hai google ko ye api use karne ke liye
// to ye jo particular route hai ham isko directly open nhi rakh sakte, ham isko ek authenticate user ke liye chalana chahenge

router.get('/get-distance-time', 
    query('origin').isString().isLength({min: 3}),
    query('destination').isString().isLength({min: 3}),
    authMiddleware.authUser,
    mapController.getDistanceTime
)

router.get('/get-suggestions',
    query('input').isString().isLength({ min: 3 }),
    authMiddleware.authUser,
    mapController.getAutoCompleteSuggestions
)


module.exports = router;
