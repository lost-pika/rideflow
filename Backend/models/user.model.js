const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  fullname: {
    firstname: {
      type: String,
      required: true,
      minlength: [3, "First name must be 3 characters long"],
    },
    lastname: {
      type: String,
      minlength: [3, "Last name must be 3 characters long"],
    },
  },
  email: {
    type: String,
    required: true,
    minlength: [5, "Password must be 5 characters long"],
  },
  password: {
    type: String,
    required: true,
    select: false, // agr aap user ko find karoge to by default password field nhi jayega
  },
  socketId: {
    type: String,
  }, // socketId ka aage ham use karne vale hai with live tracking, driver ya captain ki location ko ham share kar sake with user
});

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {expiresIn: '24h'});
  return token;
};

userSchema.methods.comparePassword = async function (password) {
  if (!this.password || !password) {
    throw new Error("Missing password data for comparison");
  }
  return await bcrypt.compare(password, this.password);
};

userSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
};

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;
