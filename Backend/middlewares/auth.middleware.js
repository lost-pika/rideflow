const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const captainModel = require("../models/captain.model");

module.exports.authUser = async (req, res, next) => {
  // hame hamara token chahiye rahega and token mainly hame 2 jagah se milta hai (header or cookies) ham dono hi jagah check karne vale hai
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized access" });
  }

  // check if the token is blackListed one
  const isBlacklisted = await userModel.findOne({ token });

  if (isBlacklisted) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // agr token mil jata hai to ham ise decoded karte hai
  // decoded me vhi data aata hai jo hamne token banate waqt pass kiya tha
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded me hame user ki id milegi

    const user = await userModel.findById(decoded._id);

    // jo bhi user mila hoga use req.user me set karenge

    req.user = user; // req.user me user ko set karte hai taki hame baad me use kar sake

    return next(); // next middleware ya route handler ko call karte hai
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports.authCaptain = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized access" });
  }

  // check if the token is blackListed one
  const isBlacklisted = await captainModel.findOne({ token });

  if (isBlacklisted) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // agr token mil jata hai to ham ise decoded karte hai
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const captain = await captainModel.findById(decoded._id);

    // jo bhi captain mila hoga use req.captain me set karenge
    req.captain = captain; // req.captain me captain ko set karte hai taki hame baad me use kar sake
    return next(); // next middleware ya route handler ko call karte hai
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
