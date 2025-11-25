import React, { useRef, useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { SocketContext } from "../context/SocketContext";
import { CaptainDataContext } from "../context/CaptainContext";
import RidePopUp from "../components/RidePopUp";
import ConfirmRidePopUp from "../components/ConfirmRidePopUp";
import CaptainDetails from "../components/CaptainDetails";
import LiveTracking from "../components/LiveTracking";
import axios from "axios";

const CaptainHome = () => {
  const [ridePopupPanel, setRidePopupPanel] = useState(false);
  const [confirmRidePopupPanel, setConfirmRidePopupPanel] = useState(false);
  const [ride, setRide] = useState(null);

  const ridePopupPanelRef = useRef(null);
  const confirmRidePopupPanelRef = useRef(null);

  const { socket } = useContext(SocketContext);
  const { captain } = useContext(CaptainDataContext);

  // ✅ FIXED: Update location with proper geolocation options
  useEffect(() => {
    if (!captain || !captain._id || !socket) {
      console.warn("⚠️ Captain or socket not ready for join");
      return;
    }

    console.log(
      "================================================================================"
    );
    console.log("🔌 CAPTAIN JOINING");
    console.log("   Captain ID:", captain._id);
    console.log("   Socket ID:", socket.id);
    console.log(
      "================================================================================"
    );

    socket.emit("join", {
      userId: captain._id,
      userType: "captain",
    });
  }, [socket, captain?._id]);

  // ✅ Add this after the captain join useEffect (after line 41)

  // Location update useEffect
  useEffect(() => {
    if (!captain || !captain._id) {
      console.warn("Captain not loaded yet, skipping location updates");
      return;
    }

    console.log("📍 Setting up location updates");
    console.log("   Captain ID:", captain._id);
    console.log("   Update interval: 10 seconds");
    console.log(
      "   Options: enableHighAccuracy=true, maximumAge=0 (force fresh)"
    );

    const geolocationOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    const updateLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            console.log("📍 CAPTAIN LOCATION:", { lat, lng });

            socket.emit("update-location-captain", {
              userId: captain._id,
              location: { lat, lng },
            });
          },
          (error) => {
            console.error("Location error:", error.message);
          },
          geolocationOptions
        );
      } else {
        console.error("Geolocation not supported by this browser");
      }
    };

    updateLocation(); // Call immediately
    const interval = setInterval(updateLocation, 10000); // Then every 10s

    return () => {
      console.log("Stopping location updates");
      clearInterval(interval);
    };
  }, [socket, captain?._id]);

  // Socket listener for new ride
  useEffect(() => {
    console.log("\n🎧 Setting up socket listeners");
    console.log("   Captain ID:", captain?._id || "NOT LOADED");
    console.log("   Socket connected:", socket?.connected || false);
    console.log("   Socket ID:", socket?.id || "N/A");

    const handleNewRide = (data) => {
      console.log("\n" + "=".repeat(80));
      console.log("🚗 NEW RIDE EVENT RECEIVED!");
      console.log("   Ride ID:", data?._id);
      console.log("   Pickup:", data?.pickup);
      console.log("   Destination:", data?.destination);
      console.log("   Fare:", data?.fare);
      console.log("   User:", data?.user?.fullname);
      console.log("=".repeat(80));

      setRide(data);
      setRidePopupPanel(true);
    };

    socket.on("new-ride", handleNewRide);
    console.log('✅ Listener attached for "new-ride" event');

    return () => {
      console.log('🔇 Removing "new-ride" listener');
      socket.off("new-ride", handleNewRide);
    };
  }, [socket, captain?._id]);

  // Confirm ride
  const confirmRide = async () => {
    if (!ride) {
      console.error("❌ No ride to confirm");
      return;
    }

    console.log("\n📤 Confirming ride:", ride._id);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/confirm`,
        {
          rideId: ride._id,
          captainId: captain._id,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      console.log("✅ Ride confirmed:", response.data);
      setRidePopupPanel(false);
      setConfirmRidePopupPanel(true);
    } catch (error) {
      console.error("❌ Error confirming ride:");
      console.error(
        "   Message:",
        error.response?.data?.message || error.message
      );
      console.error("   Status:", error.response?.status);
    }
  };

  // GSAP animations
  useEffect(() => {
    if (ridePopupPanel && ridePopupPanelRef.current) {
      gsap.to(ridePopupPanelRef.current, { y: 0, duration: 0.5 });
    } else if (ridePopupPanelRef.current) {
      gsap.to(ridePopupPanelRef.current, { y: "100%", duration: 0.5 });
    }
  }, [ridePopupPanel]);

  useEffect(() => {
    if (confirmRidePopupPanel && confirmRidePopupPanelRef.current) {
      gsap.to(confirmRidePopupPanelRef.current, { y: 0, duration: 0.5 });
    } else if (confirmRidePopupPanelRef.current) {
      gsap.to(confirmRidePopupPanelRef.current, { y: "100%", duration: 0.5 });
    }
  }, [confirmRidePopupPanel]);

  return (
    <div className="h-screen">
      {/* Header */}
      <div className="fixed p-6 top-0 flex items-center justify-between w-screen">
        <img
          className="w-16"
          src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png"
          alt="Uber"
        />
        <Link
          to="/captain-logout"
          className="h-10 w-10 bg-white flex items-center justify-center rounded-full"
        >
          <i className="text-lg font-medium ri-logout-box-r-line"></i>
        </Link>
      </div>

      {/* Map */}
      <div className="h-2/5">
            <LiveTracking />
      </div>

      {/* Captain Details */}
      <div className="h-2/5 p-6">
        <CaptainDetails />
      </div>

      {/* Ride Popup */}
      <div
        ref={ridePopupPanelRef}
        className="fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12"
      >
        <RidePopUp
          ride={ride}
          setRidePopupPanel={setRidePopupPanel}
          setConfirmRidePopupPanel={setConfirmRidePopupPanel} // ✅ ADD THIS LINE
          confirmRide={confirmRide}
        />
      </div>

      {/* Confirm Ride Popup */}
      <div
        ref={confirmRidePopupPanelRef}
        className="fixed w-full h-screen z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12"
      >
        <ConfirmRidePopUp
          ride={ride}
          setConfirmRidePopupPanel={setConfirmRidePopupPanel}
          setRidePopupPanel={setRidePopupPanel} // ✅ ADD THIS LINE
        />
      </div>

      
    </div>
  );
};

export default CaptainHome;
