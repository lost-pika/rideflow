import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Default center if geolocation fails (can be any location, e.g., Delhi)
const defaultCenter = { lat: 28.7041, lng: 77.1025 };

// Fix marker icon issue in React-Leaflet 3+ and Vite/Webpack
const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconAnchor: [12, 41],
    popupAnchor: [0, -40],
});
L.Marker.prototype.options.icon = DefaultIcon;

const containerStyle = {
    width: '100%',
    height: '100%', // Make sure parent also has proper height
};

const LiveTracking = () => {
    const [currentPosition, setCurrentPosition] = useState(defaultCenter);

    useEffect(() => {
        // Try to get initial position immediately
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCurrentPosition({ lat: latitude, lng: longitude });
                },
                (error) => {
                    console.error("Geolocation error:", error.message);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        }

        // Watch for position updates
        let watchId;
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCurrentPosition({ lat: latitude, lng: longitude });
                },
                (error) => {
                    console.error("Geolocation watch error:", error.message);
                },
                { enableHighAccuracy: true, maximumAge: 0 }
            );
        }

        return () => {
            // Clean up watch
            if (navigator.geolocation && watchId !== undefined) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, []);

    return (
        <MapContainer
            className="map-container"
            center={currentPosition}
            zoom={15}
            scrollWheelZoom={true}
            style={containerStyle}
        >
            <TileLayer
                url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${import.meta.env.VITE_GEOAPIFY_API_KEY}`}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | © <a href="https://www.geoapify.com/">Geoapify</a>'
            />
            <Marker position={currentPosition}>
                <Popup>Your Location</Popup>
            </Marker>
        </MapContainer>
    );
};

export default LiveTracking;
