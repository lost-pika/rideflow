import React from 'react'

const WaitingForDriver = (props) => {
  return (
    <div>
      <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
        props.waitingForDriver(false)
      }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>

      <div className='flex items-center justify-between'>
        <img className='h-14 object-contain' src={props.ride?.captain?.vehicle?.vehicleType === 'moto' ? '/moto.svg' : props.ride?.captain?.vehicle?.vehicleType === 'auto' ? '/auto.svg' : '/car.svg'} alt="Vehicle" />
        <div className='text-right'>
          <h2 className='text-lg font-medium capitalize'>{props.ride?.captain?.fullname?.firstname}</h2>
          <h4 className='text-xl font-semibold -mt-1 -mb-1'>{props.ride?.captain?.vehicle?.plate}</h4>
          <p className='text-sm text-gray-600 capitalize'>{props.ride?.captain?.vehicle?.color} {props.ride?.captain?.vehicle?.vehicleType}</p>
          <h1 className='text-lg font-semibold'>OTP: {props.ride?.otp} </h1>
        </div>
      </div>

      <div className='flex gap-2 justify-between flex-col items-center'>
        <div className='w-full mt-5'>
          <div className='flex items-center gap-5 p-3 border-b-2'>
            <i className="ri-map-pin-user-fill"></i>
            <div>
              <h3 className='text-base font-semibold text-gray-800'>{props.ride?.pickup?.split(',')[0] || 'Pickup'}</h3>
              <p className='text-xs text-gray-500'>{props.ride?.pickup}</p>
            </div>
          </div>
          <div className='flex items-center gap-5 p-3 border-b-2'>
            <i className="text-lg ri-map-pin-2-fill"></i>
            <div>
              <h3 className='text-base font-semibold text-gray-800'>{props.ride?.destination?.split(',')[0] || 'Destination'}</h3>
              <p className='text-xs text-gray-500'>{props.ride?.destination}</p>
            </div>
          </div>
          <div className='flex items-center gap-5 p-3'>
            <i className="ri-currency-line"></i>
            <div>
              <h3 className='text-lg font-medium'>₹{props.ride?.fare} </h3>
              <p className='text-sm -mt-1 text-gray-600'>Cash</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WaitingForDriver