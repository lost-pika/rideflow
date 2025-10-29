# Integrating everything together (frontend and backend)

*** changes in ***
- LocationSearchPanel.jsx
- Home.jsx
- ride.services.js
- ride.routes.js
- ride.controller.js
- readMe.md
- VehiclePanel.jsx (fetching fare)

Captain side integration
- CaptainDetails.jsx
- CaptainContext.jsx

- we are using socket.io for real-time communication between user and captain (learn the basics from somewhere else)
- prompt used in the video (create a new file socket.js. This file exports two functions, first initialize socket and second is sendMessage to socketId. Call the initialize function in the server.js file. Write the logic for the functions as well, files provided to copilot(app.js and server.js))
- npm i socket.io

- socket.js
- server.js

- hame same socket server se user ko bhi connect karwana hai aur captain ko bhi connect karwana hai
- to uske liye hamko kya karna rahega, jab bhi koi capatin ya user connect hoga ubki socketId ko save karwa lenge unke database me

- how to integrate socket.io on the frontend
- npm i socket.io-client

- ham ek context bna lnge socket.io ka, socketio ko ek baar connect karenge aur phir jo bhi context rahega usse hi ham use karte rahenge
- us context ke nader ham 2 func pass kar denge, ek func msges ko receive karne ke liye aur ek func msgs ko send karne ke liye

- prompt 
- create a socket.io context for the client which contains two functions one for sending message to a specific eventName and one from receiving message from a eventName, also implement basic correction logics with server
- file provided to copilot (UserContext.jsx, main.jsx)

- main.jsx
- SocketContext.jsx (change the url provided with base url)
- Home.jsx
- CaptainHome.jsx
- ride.controller.js
- maps.service.js

- location jo by default hoti hai vo localhost pe access nhi karni chahiye aur bahut se browsers mna bhi kar dete hai
- uske liye port forwarding seekhni padegi
- jaha pe terminal hai uske bagl me ports ka section hai vha jana hai
- agr post-visibility publec kari hai to ek trh se website ko host kar diya hai, ab koi bhi khol sakta hai using the link

- socket.io se hame captain ki live location mil jayegi

- ride.controller.js
- socket.js
- Home.jsx
- ride.routes.js
- CaptainHome.jsx
- rideService.js
- WaitingForDriver.jsx

# ride ko start karna
- jab captain otp dalega provided by user tabhi ride start hogi

- ConfirmRidePopUp.jsx
- CaptainHome.jsx
- ride.routes.js
- ride.controller.js
- ride.service.js
- Home.jsx
- App.jsx

- ab hame live location track karni rahegi captain aur user ki

- CaptainRiding.jsx
- FinishRide.jsx
- Riding.jsx

- ab jaise hi mai Finish Ride pe click karungi to captain home pe chala jayega, jo ride rahegi uska status complete pe set ho jayege and user home pe chala jayega


# live tracking (10:50:25)
- LiveTracking.jsx (inside components)
see what free maps you can use
