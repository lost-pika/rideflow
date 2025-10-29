import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const containerStyle = {
    width: '100%',
    height: '70%',
};

const center = {
    lat: -3.745,
    lng: -38.523
};

// Fix default marker icon issue in Leaflet + Webpack/Vite
const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png"
});
L.Marker.prototype.options.icon = DefaultIcon;

const LiveTracking = () => {
    const [ currentPosition, setCurrentPosition ] = useState(center);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            setCurrentPosition({
                lat: latitude,
                lng: longitude
            });
        });

        const watchId = navigator.geolocation.watchPosition((position) => {
            const { latitude, longitude } = position.coords;
            setCurrentPosition({
                lat: latitude,
                lng: longitude
            });
        });

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    useEffect(() => {
        const updatePosition = () => {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                console.log('Position updated:', latitude, longitude);
                setCurrentPosition({
                    lat: latitude,
                    lng: longitude
                });
            });
        };

        updatePosition(); // Initial position update
        const intervalId = setInterval(updatePosition, 1000); // Update every 1 sec
        return () => clearInterval(intervalId);
    }, []);

    return (
        <MapContainer
            className="map-container"
            center={currentPosition}
            zoom={15}
            style={containerStyle}
        >
            {/* Geoapify tile layer */}
            <TileLayer
                url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${import.meta.env.VITE_GEOAPIFY_API_KEY}`}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | © <a href="https://www.geoapify.com/">Geoapify</a>'
            />

            <Marker position={currentPosition}>
                <Popup>You are here</Popup>
            </Marker>
        </MapContainer>
    );
}

export default LiveTracking;
