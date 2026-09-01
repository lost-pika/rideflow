
import React, { useContext } from 'react'
import { CaptainDataContext } from '../context/CaptainContext'

const CaptainDetails = () => {

    const { captain } = useContext(CaptainDataContext)

    return (
        <div>
            <div className='flex items-center justify-between'>
                <div className='flex items-center justify-start gap-3'>
                    <div className='h-12 w-12 rounded-full bg-black text-white flex items-center justify-center font-bold text-lg uppercase'>
                        {captain?.fullname?.firstname?.[0] || 'C'}
                    </div>
                    <div>
                        <h4 className='text-lg font-semibold capitalize leading-tight'>{captain?.fullname?.firstname + " " + (captain?.fullname?.lastname || '')}</h4>
                        <p className='text-xs text-gray-500 capitalize'>{captain?.vehicle?.vehicleType} Captain</p>
                    </div>
                </div>
                <div className='text-right'>
                    <h4 className='text-xl font-bold text-green-600'>₹{captain?.earnings ? Number(captain.earnings).toFixed(2) : '0.00'}</h4>
                    <p className='text-xs text-gray-500'>Total Earned</p>
                </div>
            </div>
            <div className='flex p-3 mt-6 bg-gray-50 border border-gray-200 rounded-xl justify-between gap-2 items-center'>
                <div className='text-center flex-1'>
                    <i className="text-2xl text-gray-700 ri-car-line"></i>
                    <h5 className='text-sm font-semibold capitalize truncate'>{captain?.vehicle?.color} {captain?.vehicle?.vehicleType}</h5>
                    <p className='text-xs text-gray-500 font-mono tracking-wider'>{captain?.vehicle?.plate}</p>
                </div>
                <div className='text-center flex-1 border-x border-gray-200 px-1'>
                    <i className="text-2xl text-gray-700 ri-user-3-line"></i>
                    <h5 className='text-sm font-semibold'>{captain?.vehicle?.capacity || 1} Seats</h5>
                    <p className='text-xs text-gray-500'>Capacity</p>
                </div>
                <div className='text-center flex-1'>
                    <i className="text-2xl text-gray-700 ri-checkbox-circle-line"></i>
                    <h5 className='text-sm font-semibold'>{captain?.ridesCount || 0}</h5>
                    <p className='text-xs text-gray-500'>Rides Done</p>
                </div>
            </div>
        </div>
    )
}

export default CaptainDetails