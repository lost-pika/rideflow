const axios = require("axios");
const captainModel = require('../models/captain.model');

module.exports.getCoordinates = async (address) => {
  try {
    const apiKey = process.env.GEOAPIFY_API_KEY;
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${apiKey}`;
    
    const response = await axios.get(url);

    if (response.data.features.length > 0) {
      const location = response.data.features[0].geometry.coordinates; // [lng, lat]
      return {
        lat: location[1],
        lng: location[0],
      };
    } else {
      throw new Error("No results found from Geoapify");
    }
  } catch (error) {
    console.error("Error fetching coordinates:", error.message);
    throw error;
  }
};

module.exports.getDistanceTime = async (origin, destination) => {
  try {
    if (!origin || !destination) {
      throw new Error("Origin and destination are required");
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) {
      throw new Error("Geoapify API key is missing");
    }

    // --- Geocode origin ---
    const originRes = await axios.get("https://api.geoapify.com/v1/geocode/search", {
      params: { text: origin, apiKey },
    });

    if (!originRes.data?.features?.length) {
      throw new Error("Origin not found");
    }
    const [originLon, originLat] = originRes.data.features[0].geometry.coordinates;

    // --- Geocode destination ---
    const destRes = await axios.get("https://api.geoapify.com/v1/geocode/search", {
      params: { text: destination, apiKey },
    });

    if (!destRes.data?.features?.length) {
      throw new Error("Destination not found");
    }
    const [destLon, destLat] = destRes.data.features[0].geometry.coordinates;

    // --- Routing (lat,lon order required) ---
    const url = `https://api.geoapify.com/v1/routing?waypoints=${originLat},${originLon}|${destLat},${destLon}&mode=drive&apiKey=${apiKey}`;
    const routeRes = await axios.get(url);

    if (!routeRes.data?.features?.length) {
      throw new Error("Unable to fetch route");
    }

    const route = routeRes.data.features[0];
    const { time, distance } = route.properties; // seconds, meters

    // Format duration text (convert seconds → days/hours/mins)
    let durationText = "";
    let seconds = time;
    const days = Math.floor(seconds / (24 * 3600));
    seconds %= 24 * 3600;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);

    if (days > 0) durationText += `${days} day${days > 1 ? "s" : ""} `;
    if (hours > 0) durationText += `${hours} hour${hours > 1 ? "s" : ""} `;
    if (minutes > 0) durationText += `${minutes} min${minutes > 1 ? "s" : ""}`;

    // Final response (Google-style)
    return {
      distance: {
        text: `${(distance / 1000).toLocaleString()} km`,
        value: distance,
      },
      duration: {
        text: durationText.trim(),
        value: time,
      },
      status: "OK",
    };
  } catch (error) {
    console.error("Error in getDistanceTime:", error.message);
    throw error;
  }
};

module.exports.getAutoCompleteSuggestions = async (input) => {
  if (!input) {
    throw new Error("query is required");
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;
  const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
    input
  )}&apiKey=${apiKey}`;

  try {
    const response = await axios.get(url);

    if (response.data?.features?.length) {
      // Convert Geoapify response → Google-style array of suggestions
      return response.data.features
        .map((feature) => feature.properties.formatted) // take formatted address
        .filter((value) => value); // remove null/empty
    } else {
      throw new Error("Unable to fetch suggestions");
    }
  } catch (err) {
    console.error("Error in getAutoCompleteSuggestions:", err.message);
    throw err;
  }
};

module.exports.getCaptainsInTheRadius = async (ltd, lng, radius) => {
  // radius in km
  const captains = await captainModel.find({
    location: {
      $geoWithin: {
        $centerSphere: [[ltd, lng], radius / 6371],
      },
    },
  });
  return captains;
};


// mujhe yha pe 2 routes banane hai
// pehla route hamara rahega jaha pe ham address ko bhejhenge and address ke return me hame us particular address ka latitude and longitude milega
// dusra jaha par ham 2 loctaion ya address bhej rhe honge aur un dono location ke beech me travel karne me kitni distance cover hogi aur distance cover karne me kitna time lagega, ye puri detail hame dusre route se mil jayegi
