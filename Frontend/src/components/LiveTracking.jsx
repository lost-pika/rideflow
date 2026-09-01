import React, { useState, useEffect, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { SocketContext } from '../context/SocketContext';

// Default center: Muradnagar, Ghaziabad (201206)
const defaultCenter = { lat: 28.7734, lng: 77.5034 };

// Custom Leaflet DivIcons using RemixIcon
const pickupIcon = L.divIcon({
    className: 'custom-pin-pickup',
    html: `<div style="background-color: #16A34A; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); font-size: 16px;"><i class="ri-map-pin-user-fill"></i></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

const destinationIcon = L.divIcon({
    className: 'custom-pin-dest',
    html: `<div style="background-color: #DC2626; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); font-size: 16px;"><i class="ri-flag-fill"></i></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

const vehicleIcon = L.divIcon({
    className: 'custom-pin-vehicle',
    html: `<div style="background-color: #111827; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.35); font-size: 17px;"><i class="ri-car-fill"></i></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17]
});

const userIcon = L.divIcon({
    className: 'custom-pin-user',
    html: `<div style="background-color: #2563EB; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 3px 5px -1px rgba(0,0,0,0.3); font-size: 14px;"><i class="ri-record-circle-fill"></i></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
});

const containerStyle = {
    width: '100%',
    height: '100%',
};

// Component to dynamically fit route bounds
function FitRouteBounds({ coords }) {
    const map = useMap();
    useEffect(() => {
        if (coords && coords.length > 0) {
            try {
                const bounds = L.latLngBounds(coords);
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
            } catch (err) {
                console.warn("Could not fit route bounds:", err.message);
            }
        }
    }, [coords, map]);
    return null;
}

// Component to recenter map when single position updates and no active route
function RecenterMap({ position, hasRoute }) {
    const map = useMap();
    useEffect(() => {
        if (!hasRoute && position && position.lat && position.lng) {
            map.setView([position.lat, position.lng], map.getZoom(), { animate: true });
        }
    }, [position, hasRoute, map]);
    return null;
}

const LiveTracking = ({ ride }) => {
    const [currentPosition, setCurrentPosition] = useState(defaultCenter);
    const [captainLocation, setCaptainLocation] = useState(ride?.captain?.location || null);
    const [routeCoords, setRouteCoords] = useState([]);
    const [pickupPoint, setPickupPoint] = useState(null);
    const [destPoint, setDestPoint] = useState(null);

    const { socket } = useContext(SocketContext) || {};
    const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;

    // 1. IP Geolocation Fallback
    const fetchIpLocation = async () => {
        try {
            const ipRes = await axios.get(`https://api.geoapify.com/v1/ipinfo?apiKey=${apiKey}`);
            if (ipRes.data?.location) {
                const { latitude, longitude } = ipRes.data.location;
                setCurrentPosition({ lat: latitude, lng: longitude });
                console.log("📍 Located via IP:", { lat: latitude, lng: longitude }, ipRes.data.city?.name);
            }
        } catch (err) {
            console.warn("IP info lookup failed:", err.message);
        }
    };

    // 2. Geolocation Watcher & Initial Position
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCurrentPosition({ lat: latitude, lng: longitude });
                },
                (error) => {
                    console.warn("Primary geolocation error, using IP fallback:", error.message);
                    fetchIpLocation();
                },
                { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
            );
        } else {
            fetchIpLocation();
        }

        let watchId;
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCurrentPosition({ lat: latitude, lng: longitude });
                },
                (error) => {
                    // Suppress continuous watch warnings
                },
                { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }
            );
        }

        return () => {
            if (navigator.geolocation && watchId !== undefined) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [apiKey]);

    // 3. Listen for live captain location updates from Socket
    useEffect(() => {
        if (!socket) return;

        const handleCaptainLocation = (data) => {
            if (data?.location?.lat && data?.location?.lng) {
                setCaptainLocation(data.location);
            }
        };

        socket.on('captain-location-update', handleCaptainLocation);
        return () => {
            socket.off('captain-location-update', handleCaptainLocation);
        };
    }, [socket]);

    // 4. Fetch Route Coordinates when ride is active
    useEffect(() => {
        if (!ride?.pickup || !ride?.destination) return;

        let isMounted = true;
        const fetchRoute = async () => {
            try {
                // Geocode pickup
                const pickupRes = await axios.get(
                    `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(ride.pickup)}&bias=countrycode:in&apiKey=${apiKey}`
                );
                // Geocode destination
                const destRes = await axios.get(
                    `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(ride.destination)}&bias=countrycode:in&apiKey=${apiKey}`
                );

                if (!pickupRes.data?.features?.length || !destRes.data?.features?.length) {
                    console.warn("Could not geocode pickup or destination for route");
                    return;
                }

                const [pLon, pLat] = pickupRes.data.features[0].geometry.coordinates;
                const [dLon, dLat] = destRes.data.features[0].geometry.coordinates;

                if (isMounted) {
                    setPickupPoint({ lat: pLat, lng: pLon, address: ride.pickup });
                    setDestPoint({ lat: dLat, lng: dLon, address: ride.destination });
                }

                // Fetch driving route waypoints
                const routeUrl = `https://api.geoapify.com/v1/routing?waypoints=${pLat},${pLon}|${dLat},${dLon}&mode=drive&apiKey=${apiKey}`;
                const routeRes = await axios.get(routeUrl);

                if (routeRes.data?.features?.length > 0) {
                    const geom = routeRes.data.features[0].geometry;
                    let coords = [];
                    if (geom.type === 'LineString') {
                        coords = geom.coordinates.map(c => [c[1], c[0]]);
                    } else if (geom.type === 'MultiLineString') {
                        coords = geom.coordinates.flat().map(c => [c[1], c[0]]);
                    }
                    if (isMounted && coords.length > 0) {
                        setRouteCoords(coords);
                    }
                }
            } catch (err) {
                console.error("Error fetching route in LiveTracking:", err.message);
            }
        };

        fetchRoute();
        return () => {
            isMounted = false;
        };
    }, [ride?.pickup, ride?.destination, apiKey]);

    const hasRoute = routeCoords.length > 0;
    const activeVehicleLocation = captainLocation || (ride ? currentPosition : null);

    return (
        <MapContainer
            className="map-container"
            center={currentPosition}
            zoom={15}
            scrollWheelZoom={true}
            style={containerStyle}
        >
            <TileLayer
                url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${apiKey}`}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | &copy; <a href="https://www.geoapify.com/">Geoapify</a>'
            />

            {/* Highlighted Driving Route */}
            {hasRoute && (
                <>
                    <Polyline
                        positions={routeCoords}
                        color="#2563EB"
                        weight={6}
                        opacity={0.85}
                        lineJoin="round"
                    />
                    <FitRouteBounds coords={routeCoords} />
                </>
            )}

            {/* Pickup Marker */}
            {pickupPoint && (
                <Marker position={[pickupPoint.lat, pickupPoint.lng]} icon={pickupIcon}>
                    <Popup>
                        <div className="text-xs">
                            <strong className="text-green-700">Pickup:</strong>
                            <p>{pickupPoint.address}</p>
                        </div>
                    </Popup>
                </Marker>
            )}

            {/* Destination Marker */}
            {destPoint && (
                <Marker position={[destPoint.lat, destPoint.lng]} icon={destinationIcon}>
                    <Popup>
                        <div className="text-xs">
                            <strong className="text-red-700">Destination:</strong>
                            <p>{destPoint.address}</p>
                        </div>
                    </Popup>
                </Marker>
            )}

            {/* Live Moving Captain / Vehicle Marker */}
            {activeVehicleLocation && (
                <Marker position={[activeVehicleLocation.lat, activeVehicleLocation.lng]} icon={vehicleIcon}>
                    <Popup>
                        <div className="text-xs">
                            <strong>Captain Live Location</strong>
                        </div>
                    </Popup>
                </Marker>
            )}

            {/* Standard User Position Marker (when not in a route or captain not tracking) */}
            {!hasRoute && !activeVehicleLocation && (
                <Marker position={[currentPosition.lat, currentPosition.lng]} icon={userIcon}>
                    <Popup>Your Location</Popup>
                </Marker>
            )}

            {/* Dynamic recentering when no route */}
            <RecenterMap position={currentPosition} hasRoute={hasRoute} />
        </MapContainer>
    );
};

export default LiveTracking;
