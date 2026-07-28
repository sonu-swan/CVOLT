import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import Auth from "./pages/Auth.jsx";
import Home from "./pages/Home.jsx";
import { useSelector, useDispatch } from "react-redux";
import { setUserData } from "./redux/user.Slice.js";
import InterviewPage from "./pages/InterviewPage.jsx";
import Interview from "./components/Interview.jsx";
import Report from "./components/Report.jsx";
import History from "./pages/History.jsx";
export const ServerUrl = "http://localhost:8000"

function App() {
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try{
        const result = await axios.get(ServerUrl + "/api/user/current-user", { withCredentials: true })
        dispatch(setUserData(result.data))
        console.log("User found:", result.data)
      }
      catch(error){
        console.log("Not authenticated:", error.message)
        dispatch(setUserData(null))
      }
      finally{
        setLoading(false)
      }
    }
    getUser()
  }, [])

  if(loading) return <div>Loading...</div>

  return (
    <Routes>
   <Route path='/' element={userData ? <Home /> : <Navigate to="/auth" />} />
   <Route path='/auth' element={userData ? <Navigate to="/" /> : <Auth />} />
   <Route path='/interviewPage' element={userData ? <InterviewPage /> : <Navigate to="/auth" />} /> 
    <Route path='/interview' element={userData ? <Interview /> : <Navigate to="/auth" />} />
    <Route path="/interview/report/:interviewId" element={userData ? <Report /> : <Navigate to="/auth" />} />
    {/* NEW: needed for the "Interview History" / "Performance" cards on Home */}
    <Route path="/history" element={userData ? <History /> : <Navigate to="/auth" />} />
    </Routes>
  );
}

export default App;