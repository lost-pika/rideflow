import React, { useRef, useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { SocketContext } from '../context/SocketContext'
import { CaptainDataContext } from '../context/CaptainContext'
import RidePopUp from '../components/RidePopUp'
import ConfirmRidePopUp from '../components/ConfirmRidePopUp'
import CaptainDetails from '../components/CaptainDetails'
import axios from 'axios'

const CaptainHome = () => {
    const [ridePopupPanel, setRidePopupPanel] = useState(false)
    const [confirmRidePopupPanel, setConfirmRidePopupPanel] = useState(false)
    const [ride, setRide] = useState(null)

    const ridePopupPanelRef = useRef(null)
    const confirmRidePopupPanelRef = useRef(null)

    const { socket } = useContext(SocketContext)
    const { captain } = useContext(CaptainDataContext)

    // join socket room + update location every 10s
    useEffect(() => {
        socket.emit('join', { userId: captain._id, userType: 'captain' })

        const updateLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(pos => {
                    socket.emit('update-location-captain', {
                        userId: captain._id,
                        location: { lat: pos.coords.latitude, lng: pos.coords.longitude }
                    })
                })
            }
        }

        updateLocation()
        const interval = setInterval(updateLocation, 10000)
        return () => clearInterval(interval)
    }, [socket, captain._id])

    // socket listener for new ride
    useEffect(() => {
        const handleNewRide = data => {
            setRide(data)
            setRidePopupPanel(true)
        }

        socket.on('new-ride', handleNewRide)
        return () => socket.off('new-ride', handleNewRide)
    }, [socket])

    // confirm ride
    const confirmRide = async () => {
        if (!ride) return

        await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/confirm`, {
            rideId: ride._id,
            captainId: captain._id
        }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })

        setRidePopupPanel(false)
        setConfirmRidePopupPanel(true)
    }

    // GSAP animation
    useEffect(() => {
        if (ridePopupPanel && ridePopupPanelRef.current) {
            gsap.to(ridePopupPanelRef.current, { y: 0, duration: 0.5 })
        } else if (ridePopupPanelRef.current) {
            gsap.to(ridePopupPanelRef.current, { y: '100%', duration: 0.5 })
        }
    }, [ridePopupPanel])

    useEffect(() => {
        if (confirmRidePopupPanel && confirmRidePopupPanelRef.current) {
            gsap.to(confirmRidePopupPanelRef.current, { y: 0, duration: 0.5 })
        } else if (confirmRidePopupPanelRef.current) {
            gsap.to(confirmRidePopupPanelRef.current, { y: '100%', duration: 0.5 })
        }
    }, [confirmRidePopupPanel])

    return (
        <div className="h-screen relative">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 p-6 flex justify-between z-50">
                <img className="w-16" src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png" alt="logo" />
                <Link to='/captain-home' className="h-10 w-10 bg-white flex items-center justify-center rounded-full">
                    <i className="text-lg font-medium ri-logout-box-r-line"></i>
                </Link>
            </div>

            {/* Background / Map */}
            <div className="h-3/5">
                <img className="h-full w-full object-cover" src="https://miro.medium.com/v2/resize:fit:1400/0*gwMx05pqII5hbfmX.gif" alt="map" />
            </div>

            {/* Captain Details */}
            <div className="h-2/5 p-6">
                <CaptainDetails />
            </div>

            {/* RidePopUp */}
            <div
                ref={ridePopupPanelRef}
                className="fixed w-full bottom-0 z-50 bg-white px-3 py-10 pt-12"
                style={{ transform: 'translateY(100%)' }}
            >
                <RidePopUp
                    ride={ride}
                    setRidePopupPanel={setRidePopupPanel}
                    setConfirmRidePopupPanel={setConfirmRidePopupPanel}
                    confirmRide={confirmRide}
                />
            </div>

            {/* ConfirmRidePopUp */}
            <div
                ref={confirmRidePopupPanelRef}
                className="fixed w-full h-screen bottom-0 z-50 bg-white px-3 py-10 pt-12"
                style={{ transform: 'translateY(100%)' }}
            >
                <ConfirmRidePopUp
                    ride={ride}
                    setConfirmRidePopupPanel={setConfirmRidePopupPanel}
                    setRidePopupPanel={setRidePopupPanel}
                />
            </div>
        </div>
    )
}

export default CaptainHome
