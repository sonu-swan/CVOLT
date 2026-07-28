import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "motion/react";
import { BsRobot, BsCoin } from "react-icons/bs";
import { HiOutlineLogout } from "react-icons/hi";
import { FaUserAstronaut } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ServerUrl } from "../App.jsx";
import { setUserData } from "../redux/user.Slice.js";
import AuthModel from "./AuthModel";

function Navbar() {
  const { userData } = useSelector((state) => state.user);
  const [showCreditPopup, setShowCreditPopup] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showAuth, setShowAuth] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.get(ServerUrl + "/api/auth/logout", {
        withCredentials: true,
      });
      dispatch(setUserData(null));
      setShowProfilePopup(false);
      setShowCreditPopup(false);
      navigate("/auth");
    } catch (error) {
      console.log("error logging out:", error.message);
    }
  };

  return (
    <div className="min-h-[90px] bg-gradient-to-b from-gray-300 via-gray-200 to-gray-300 flex justify-center px-4 pt-6">
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-6xl bg-white rounded-[24px] shadow-sm border border-gray-200 px-8 py-4 flex justify-between items-center relative"
      >
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="bg-black text-white p-2 rounded-lg">
            <BsRobot size={20} />
          </div>
          <h1 className="font-semibold hidden md:block text-lg">cvolt</h1>
        </div>
        <div className="flex items-center gap-6 relative">
          <div className="relative">
            <button
              onClick={() => {
                if (!userData) {
                  setShowAuth(true);
                  return;
                }
                setShowCreditPopup(!showCreditPopup);
                setShowProfilePopup(false);
              }}
              className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full text-md hover:bg-gray-200 transition"
            >
              <BsCoin size={20} />
              {userData?.credits || 0}
            </button>
            {showCreditPopup && (
              <div className="absolute right-[-50px] mt-3 w-64 bg-white shadow-xl border border-gray-200 rounded p-5 z-50">
                <p className="text-sm text-gray-500">Your current credits</p>
                <button
                  onClick={() => navigate("/credits")}
                  className="w-full bg-black text-white py-2 rounded-lg text-sm"
                >
                  buy more credits
                </button>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => {
                if (!userData) {
                  setShowAuth(true);
                  return;
                }
                setShowProfilePopup(!showProfilePopup);
              }}
              className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center font-semibold"
            >
              {userData ? (
                userData?.name.slice(0, 1).toUpperCase()
              ) : (
                <FaUserAstronaut size={16} />
              )}
            </button>
            {showProfilePopup && (
              <div className="absolute right-0 mt-3 w-64 bg-white shadow-xl border border-gray-200 rounded p-5 z-50">
                <p className="w-full text-left text-sm py-2 hover:text-black text-gray-600">
                  {userData?.name}
                </p>
                <button className="w-full text-left text-sm py-2 hover:text-black text-gray-600">
                  Interview History
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-sm py-2 flex items-center gap-2 text-red-500"
                >
                  <HiOutlineLogout size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
    </div>
  );
}

export default Navbar;