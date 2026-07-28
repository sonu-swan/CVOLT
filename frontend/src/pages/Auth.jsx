import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { LiaRobotSolid } from "react-icons/lia";
import { GiSparkles } from "react-icons/gi";
import { motion } from "motion/react";
import { FaGooglePlusG } from "react-icons/fa6";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../utils/firebase.js";
import { ServerUrl } from "../App.jsx";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/user.Slice.js";

function Auth({ isModel = false }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleGoogleAuth = async() => {
        try{
            console.log("Starting Google Auth...")
            const response = await signInWithPopup(auth, provider)
            let user = response.user
            let name = user.displayName
            let email = user.email
            console.log("Firebase user:", {name, email})
            const result = await axios.post(ServerUrl + "/api/auth/google", {name, email}, { withCredentials: true })
            dispatch(setUserData(result.data))
            navigate("/")
        }
        catch(error){
            console.error("Auth Error:", error.response?.data || error.message)
          dispatch(setUserData(null))
        }
    }
    return(
    <div className={`
        w-full
        ${isModel ? "py-4" : 
        "min-h-screen bg-[#f3f3f3] flex items-center justify-center px-6 py-20"} `}>
        <motion.div 
        initial ={{opacity:0, y: -40}}
        animate ={{opacity:1, y:0}}
        transition ={{duration:1.05}}
        className="w-full max-w-md p-8 rounded-3xl bg-white shadow-2xl border border-gray-200">
            <div className="flex items-center justify-center gap-3 mb-6">
                <div className="bg-black text-white p-2 rounded-lg">
                    <LiaRobotSolid />
                </div>
                <h2 className="text-2xl md:text-3xl font-semibold text-lg">interview</h2>
            </div>
            <h1 className ="text-2xl md:text-3xl font-semibold text-center leading-snug mb-4">
                continue with
                <span className ="bg-skyblue-100 text-green-600 px-3 py-1 rounded-full inline-flex items-center gap2">
                    <GiSparkles size ={16}/>
                    AI interview
                </span>
            </h1>
            <p className ="text-gray-500 text-center text-sm md:text-base loading-relaxed mb-8">
                sign in to start Ai Mock Interviews, track your progress, and unclock detailed performance insights.
            </p>
<motion.button
  whileHover={{ opacity: 0.6, scale: 1.03 }}
  whileTap={{ opacity: 1, scale: 0.8 }}
  onClick={handleGoogleAuth}
  className="w-full flex items-center justify-center gap-3 py-3 bg-black text-white rounded-full shadow-md"
>
  <FaGooglePlusG size={20} />
  continue with google
</motion.button> 
</motion.div>
</div>
    )
}
export default Auth