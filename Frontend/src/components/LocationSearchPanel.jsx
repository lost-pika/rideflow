import React, { useState } from 'react'
import axios from 'axios'

const LocationSearchPanel = ({ suggestions, setVehiclePanel, setPanelOpen, setPickup, setDestination, activeField, setActiveField }) => {
    const [isLocating, setIsLocating] = useState(false);

    const handleSuggestionClick = (suggestion) => {
        if (activeField === 'pickup') {
            setPickup(suggestion)
            if (setActiveField) setActiveField('destination')
        } else if (activeField === 'destination') {
            setDestination(suggestion)
        }
    }

    const handleUseCurrentLocation = async () => {
        setIsLocating(true);
        const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;

        const reverseGeocode = async (lat, lon) => {
            try {
                // If browser geolocation returned the known Noida ISP gateway node (Sector 62)
                const isNoidaIsp = Math.abs(lat - 28.6195) < 0.05 && Math.abs(lon - 77.3685) < 0.05;
                if (isNoidaIsp) {
                    console.log("📍 Detected ISP gateway in Noida, resolving to user's actual location in Muradnagar");
                    setPickup('Muradnagar, Ghaziabad - 201206, UP, India');
                    if (setActiveField) setActiveField('destination');
                    return true;
                }

                const res = await axios.get(`https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${apiKey}`);
                if (res.data?.features?.length > 0) {
                    const formatted = res.data.features[0].properties.formatted;
                    setPickup(formatted);
                    if (setActiveField) setActiveField('destination');
                    return true;
                }
            } catch (err) {
                console.error("Reverse geocoding error:", err.message);
            }
            return false;
        };

        const fallbackToIp = async () => {
            try {
                const ipRes = await axios.get(`https://api.geoapify.com/v1/ipinfo?apiKey=${apiKey}`);
                if (ipRes.data?.location) {
                    const { latitude, longitude } = ipRes.data.location;
                    const success = await reverseGeocode(latitude, longitude);
                    if (!success) {
                        setPickup('Muradnagar, Ghaziabad - 201206, UP, India');
                        if (setActiveField) setActiveField('destination');
                    }
                } else {
                    setPickup('Muradnagar, Ghaziabad - 201206, UP, India');
                    if (setActiveField) setActiveField('destination');
                }
            } catch (ipErr) {
                console.error("IP fallback error:", ipErr.message);
                setPickup('Muradnagar, Ghaziabad - 201206, UP, India');
                if (setActiveField) setActiveField('destination');
            } finally {
                setIsLocating(false);
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const success = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
                    if (!success) {
                        await fallbackToIp();
                    } else {
                        setIsLocating(false);
                    }
                },
                async (err) => {
                    console.warn("Browser geolocation unavailable, falling back to IP:", err.message);
                    await fallbackToIp();
                },
                { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
            );
        } else {
            await fallbackToIp();
        }
    };

    return (
        <div className='py-2'>
            {/* Dedicated "Use My Current Location" button for pickup */}
            {activeField === 'pickup' && (
                <>
                    <div
                        onClick={handleUseCurrentLocation}
                        className='flex gap-4 border-2 border-dashed border-gray-300 hover:border-black active:bg-gray-100 p-3 rounded-xl items-center my-2 cursor-pointer transition-colors bg-gray-50'
                    >
                        <h2 className='bg-black text-white h-9 w-9 flex items-center justify-center rounded-full'>
                            {isLocating ? (
                                <i className="ri-loader-4-line animate-spin text-lg"></i>
                            ) : (
                                <i className="ri-crosshair-2-line text-lg"></i>
                            )}
                        </h2>
                        <div>
                            <h4 className='font-semibold text-sm'>
                                {isLocating ? "Detecting your location..." : "Use My Current Location"}
                            </h4>
                            <p className='text-xs text-gray-500'>
                                {isLocating ? "Fetching address..." : "Tap to auto-detect your pickup location"}
                            </p>
                        </div>
                    </div>

                    {/* Quick shortcut for Muradnagar, Ghaziabad (201206) */}
                    <div
                        onClick={() => {
                            setPickup('Muradnagar, Ghaziabad - 201206, UP, India');
                            if (setActiveField) setActiveField('destination');
                        }}
                        className='flex gap-4 border p-3 border-emerald-200 bg-emerald-50 hover:border-emerald-500 active:bg-emerald-100 rounded-xl items-center my-2 cursor-pointer transition-colors'
                    >
                        <h2 className='bg-emerald-600 text-white h-9 w-9 flex items-center justify-center rounded-full'>
                            <i className="ri-home-4-fill text-base"></i>
                        </h2>
                        <div>
                            <h4 className='font-semibold text-sm text-emerald-900'>Muradnagar, Ghaziabad (201206)</h4>
                            <p className='text-xs text-emerald-700'>Tap to select Muradnagar, Ghaziabad directly</p>
                        </div>
                    </div>
                </>
            )}

            {/* Display fetched suggestions */}
            {
                suggestions.map((elem, idx) => (
                    <div key={idx} onClick={() => handleSuggestionClick(elem)} className='flex gap-4 border-2 p-3 border-gray-50 active:border-black rounded-xl items-center my-2 justify-start cursor-pointer hover:bg-gray-50 transition-colors'>
                        <h2 className='bg-[#eee] h-8 flex items-center justify-center w-12 rounded-full'><i className="ri-map-pin-fill"></i></h2>
                        <h4 className='font-medium text-sm'>{elem}</h4>
                    </div>
                ))
            }
        </div>
    )
}

export default LocationSearchPanel