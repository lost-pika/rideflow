import React, { useRef, useState, useEffect, useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import FinishRide from '../components/FinishRide'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import LiveTracking from '../components/LiveTracking'
import { SocketContext } from '../context/SocketContext'
import { CaptainDataContext } from '../context/CaptainContext'

const CaptainRiding = () => {

    const [ finishRidePanel, setFinishRidePanel ] = useState(false)
    const finishRidePanelRef = useRef(null)
    const location = useLocation()
    const rideData = location.state?.ride

    const { socket } = useContext(SocketContext) || {}
    const { captain } = useContext(CaptainDataContext) || {}

    // Continuously emit captain location during the ride
    useEffect(() => {
        if (!socket) return;
        const currentCaptain = captain || JSON.parse(localStorage.getItem('captain') || '{}');
        const captainId = currentCaptain?._id;
        if (!captainId) return;

        const emitCaptainLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const { latitude: lat, longitude: lng } = pos.coords;
                        socket.emit('update-location-captain', {
                            userId: captainId,
                            location: { lat, lng }
                        });
                    },
                    (err) => {},
                    { enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 }
                );
            }
        };

        emitCaptainLocation();
        const interval = setInterval(emitCaptainLocation, 10000);
        return () => clearInterval(interval);
    }, [socket, captain]);

    useGSAP(function () {
        if (finishRidePanel) {
            gsap.to(finishRidePanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(finishRidePanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ finishRidePanel ])


    return (
        <div className='h-screen flex flex-col justify-between relative overflow-hidden'>

            <Link to='/captain-home' className='fixed right-4 top-4 h-10 w-10 bg-white shadow-lg flex items-center justify-center rounded-full z-[1001]'>
                <i className="text-lg font-medium ri-logout-box-r-line"></i>
            </Link>

            {/* Interactive Map Area - No z-[-1] so zooming and panning work smoothly */}
            <div className='h-4/5 w-full'>
                <LiveTracking ride={rideData} />
            </div>

            {/* Bottom Bar */}
            <div
                className='h-1/5 p-6 flex items-center justify-between relative bg-yellow-400 cursor-pointer shadow-lg z-10'
                onClick={() => {
                    setFinishRidePanel(true)
                }}
            >
                <h5 className='p-1 text-center w-[90%] absolute top-0'>
                    <i className="text-3xl text-gray-800 ri-arrow-up-wide-line"></i>
                </h5>
                <h4 className='text-xl font-semibold'>
                    {rideData?.distance ? `${(rideData.distance / 1000).toFixed(1)} KM away` : 'Trip in progress'}
                </h4>
                <button className='bg-green-600 hover:bg-green-700 active:scale-95 transition-transform text-white font-semibold p-3 px-8 rounded-lg shadow'>
                    Complete Ride
                </button>
            </div>

            {/* Slide-up Finish Ride Modal */}
            <div
                ref={finishRidePanelRef}
                className='fixed w-full z-[1050] bottom-0 translate-y-full bg-white px-3 py-10 pt-12 shadow-2xl rounded-t-3xl max-h-[85vh] overflow-y-auto'
            >
                <FinishRide
                    ride={rideData}
                    setFinishRidePanel={setFinishRidePanel}
                />
            </div>

        </div>
    )
}

export default CaptainRiding