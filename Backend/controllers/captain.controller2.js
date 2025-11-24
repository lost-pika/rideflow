const captainModel = require('../models/captain.model');
const captainService = require('../services/captain.service');
const { validationResult } = require('express-validator');
const blacklistTokenModel = require('../models/blacklistToken.model');

module.exports.registerCaptain = async (req, res, next) => {
   const errors = validationResult(req);
   if(!errors.isEmpty()) {
       return res.status(400).json({ errors: errors.array() });
   }

   const {fullname, email, password, vehicle} = req.body;

   const isCaptainAlreadyExist = await captainModel.findOne({email});

   if(isCaptainAlreadyExist) {
    res .status(400).json({message: "Captain with this email already exists"});
   }

   const hashPassword = await captainModel.hashPassword(password);

   const captain = await captainService.createCaptain({
       firstname: fullname.firstname,
       lastname: fullname.lastname,
       email,
       password: hashPassword,
       color: vehicle.color,
       plate: vehicle.plate,
       capacity: vehicle.capacity,
       vehicleType: vehicle.vehicleType
   });

   if (!captain) {
    return res.status(500).json({ message: "Captain creation failed" });
  }

   const token = captain.generateAuthToken();

   res.status(201).json({token, captain})
   
}

module.exports.loginCaptain = async (req, res, next) => {
    const errors = validationResult(req);       
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {email, password} = req.body;
    const captain = await captainModel.findOne({email}).select("+password");

    if(!captain) {
        return res.status(401).json({message: "Invalid email or password"});
    }

    const isPasswordMatch = await captain.comparePassword(password);

    if(!isPasswordMatch) {
        return res.status(401).json({message: "Invalid email or password"});
    }

    const token = captain.generateAuthToken();

    res.cookie('token', token);

    res.status(200).json({token, captain});
}

module.exports.getCaptainProfile = async (req, res, next) => { 
    // const captainId = req.captain._id;

    // if(!captainId) {
    //     return res.status(400).json({message: "Captain ID is required"});
    // }

    // const captain = await captainModel.findById(captainId);

    // if(!captain) {
    //     return res.status(404).json({message: "Captain not found"});
    // }

    // res.status(200).json({captain});

    // YA TO UPAR WALA CODE USE KARO YA NEECHE WALA

    res.status(200).json({captain: req.captain});
}

module.exports.logoutCaptain = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized access" });
    }

    await blacklistTokenModel.create({token});

    res.clearCookie('token');

    res.status(200).json({ message: "Logged out successfully" });
}
