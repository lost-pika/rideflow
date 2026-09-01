const mongoose = require("mongoose");

function connectToDb() {
  return mongoose
    .connect(process.env.DB_CONNECT)
    .then(() => {
      console.log("Connected to DB");
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err.message);
      throw err;
    });
}

module.exports = connectToDb;
