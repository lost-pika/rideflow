const socketIo = require("socket.io");
const userModel = require("./models/user.model");
const captainModel = require("./models/captain.model");
const rideModel = require("./models/ride.model");

let io;

function initializeSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  console.log("✅ Socket.io initialized with CORS");

  io.on("connection", (socket) => {
    console.log("\n" + "=".repeat(80));
    console.log("🔌 NEW CLIENT CONNECTED");
    console.log("   Socket ID:", socket.id);
    console.log("   Time:", new Date().toISOString());
    console.log("=".repeat(80));

    socket.on("join", async (data) => {
      const { userId, userType } = data;

      console.log("\n📥 JOIN EVENT RECEIVED:");
      console.log("   User ID:", userId);
      console.log("   User Type:", userType);
      console.log("   Socket ID:", socket.id);

      console.log(
        "================================================================================"
      );
      console.log("🔌 JOIN EVENT RECEIVED");
      console.log("   User ID:", userId);
      console.log("   User Type:", userType);
      console.log("   Socket ID:", socket.id);
      console.log(
        "================================================================================"
      );

      try {
        if (userType === "user") {
          await userModel.findByIdAndUpdate(userId, { socketId: socket.id });
          console.log("✅ User", userId, "socketId updated to", socket.id);

          // Verify
          const user = await userModel.findById(userId);
          console.log("   Verification - SocketId in DB:", user.socketId);
        } else if (userType === "captain") {
          await captainModel.findByIdAndUpdate(userId, { socketId: socket.id });
          console.log("✅ Captain", userId, "socketId updated to", socket.id);

          // Verify
          const captain = await captainModel.findById(userId);
          console.log(
            "   Verification - Captain socketId in DB:",
            captain.socketId
          );
        }
      } catch (error) {
        console.error("❌ Error in join event:", error.message);
      }
    });

    socket.on("update-location-captain", async (data) => {
      const { userId, location } = data;

      console.log("\n📍 CAPTAIN LOCATION UPDATE:");
      console.log("   Captain ID:", userId);
      console.log("   Location:", JSON.stringify(location));

      if (!location || !location.lat || !location.lng) {
        console.error("❌ Invalid location data:", location);
        return socket.emit("error", { message: "Invalid location data" });
      }

      try {
        await captainModel.findByIdAndUpdate(userId, {
          location: {
            lat: location.lat,
            lng: location.lng,
          },
        });

        console.log(`✅ Location saved to DB`);

        // Verify
        const captain = await captainModel.findById(userId);
        console.log(
          `   Verification - Location in DB: ${JSON.stringify(
            captain.location
          )}`
        );

        // Broadcast to user if captain has active ride
        const activeRide = await rideModel
          .findOne({
            captain: userId,
            status: { $in: ["accepted", "ongoing"] },
          })
          .populate("user");

        if (activeRide && activeRide.user && activeRide.user.socketId) {
          io.to(activeRide.user.socketId).emit("captain-location-update", {
            location: {
              lat: location.lat,
              lng: location.lng,
            },
          });
          console.log(`📤 Broadcasted location to user ${activeRide.user._id}`);
        }
      } catch (error) {
        console.error("❌ Error updating captain location:", error.message);
      }
    });

    socket.on("disconnect", () => {
      console.log("\n❌ CLIENT DISCONNECTED");
      console.log("   Socket ID:", socket.id);
      console.log("   Time:", new Date().toISOString());
    });
  });
}

function sendMessage({
  socketId = null,
  room = null,
  event = "",
  data = {},
} = {}) {
  console.log("\n📤 SEND MESSAGE:");
  console.log("   Event:", event);
  console.log("   Socket ID:", socketId || "N/A");
  console.log("   Room:", room || "N/A");
  console.log("   Data keys:", Object.keys(data).join(", "));

  if (!io) {
    console.error("❌ Socket IO not initialized yet");
    return;
  }
  if (!event) {
    console.error("❌ sendMessage requires event name");
    return;
  }
  if (room) {
    io.to(room).emit(event, data);
    console.log(`✅ Emitted '${event}' to room '${room}'`);
    return;
  }
  if (socketId) {
    io.to(socketId).emit(event, data);
    console.log(`✅ Emitted '${event}' to socket '${socketId}'`);
    return;
  }
  console.warn("⚠️ sendMessage called without socketId or room", {
    event,
    data,
  });
}

module.exports = { initializeSocket, sendMessage };
