import React, { useState } from "react";
import { Link } from "react-router-dom";
import {UserDataContext} from "../context/UserContext";
import {useNavigate} from "react-router-dom";
import axios from "axios";
import { useContext } from "react";

const UserLogin = () => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [userData, setUserData] = useState({});

    const {user, setUser} = useContext(UserDataContext);
    const navigate = useNavigate();


    const submitHandler = async (e) => {
        e.preventDefault();
        const userData = {
            email: email,
            password: password
        }

        const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/login`, userData);

        if(response.status === 200) {
            const data = response.data;
            setUser(data.user);
            localStorage.setItem("token", data.token);
            navigate("/home");
        }

        setEmail("");
        setPassword("");
    }

  return (
    <div className="p-7 h-screen flex flex-col justify-between ">
      <div >
        <img
          className="w-16 mb-10 mr-200"
          src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png"
          alt=""
        />
        <form action="" onSubmit={(e) => {
            submitHandler(e);
        }}>
          <h3 className="text-lg font-medium mb-2">What's your email</h3>
          <input
            className="bg-[#eeeeee] mb-7 rounded px-4 py-2 border w-full text-lg placeholder:text-base"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            name="email"
            placeholder="email@example.com"
          />
          <h3 className="text-lg font-medium  mb-2">Enter Password</h3>
          <input
            className="bg-[#eeeeee] mb-7 rounded px-4 py-2 border w-full text-lg placeholder:text-base"
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            name="password"
            placeholder="password"
          />
          <button className="bg-[#111] text-white font-semibold mb-3 rounded px-4 py-2 w-full text-lg placeholder:text-base">
            Login
          </button>

          
        </form>
        <p className="text-center">New here? <Link to="/signup" className="text-blue-600">Create new Account</Link></p>
      </div>

      <div>
        <Link to="/captain-login" className="bg-[#10b461] flex items-center  text-white font-semibold mb-5 rounded px-4 py-2 w-full text-lg placeholder:text-base">Sign in as Captain</Link>
      </div>
    </div>
  );
};

export default UserLogin;
