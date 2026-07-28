import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useSelector, useDispatch } from 'react-redux';
import { setUserData } from '../redux/user.Slice.js'; // adjust path if different in your project
import axios from 'axios';
import {
  FaUserTie,
  FaFileUpload,
  FaMicrophoneAlt,
  FaChartLine,
} from "react-icons/fa";

// Matches App.jsx's ServerUrl (port 8000). Previously defaulted to 5000, which
// silently pointed this file at the wrong backend if the env var wasn't set.
const ServerUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

function SetUp({ onStart }) {
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [mode, setMode] = useState("technical");
  const [resumeFile, setResumeFile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [resumeText, setResumeText] = useState("");
  const [analysisDone, setAnalysisDone] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleUploadResume = async () => {
    if (!resumeFile || analyzing) return;
    setAnalyzing(true);

    const formdata = new FormData();
    formdata.append("resume", resumeFile);

    try {
      const result = await axios.post(
        ServerUrl + "/api/interview/resume",
        formdata,
        { withCredentials: true }
      );

      console.log(result.data);

      setRole(result.data.role || "");
      setExperience(result.data.experience || "");
      setProjects(result.data.projects || []);
      setSkills(result.data.skills || []);
      setResumeText(result.data.resumeText || "");
      setAnalysisDone(true);
      setAnalyzing(false);
    } catch (error) {
      console.log(error);
      setAnalyzing(false);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      // FIXED: was axios.ost (typo -> crashed every call)
      // FIXED: was "api/interview/generate-questions" (missing leading slash)
      const result = await axios.post(
        ServerUrl + "/api/interview/generate-questions",
        { role, experience, mode, resumeText, projects, skills },
        { withCredentials: true }
      );
      console.log(result.data);

      if (userData) {
        dispatch(setUserData({ ...userData, credits: result.data.creditsLeft }));
      }

      setLoading(false);
      onStart({ ...result.data, userName: userData?.name });
    } catch (error) {
      console.log(error);
      setLoading(false); // FIXED: was missing -> button got stuck on "starting..." forever on failure
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-4"
    >
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl grid md:grid-cols-2 overflow-hidden">
        <motion.div
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className='relative bg-gradient-to-br from-green-50 to-green-100 p-12 flex flex-col justify-center'
        >
          <h2 className='text-4xl font-bold text-gray-800 mb-6'>
            start your AI interview
          </h2>
          <p className='text-gray-600 mb-10'>
            practise real interview scenarios powered by CVOLT.
            Improve communication, technical skills, and confidence.
          </p>

          <div className='space-y-5'>
            {[
              {
                icon: <FaUserTie className='text-green-600 text-xl' />,
                text: "choose Role & experience",
              },
              {
                icon: <FaMicrophoneAlt className="text-green-600 text-xl" />,
                text: "smart voice Interview",
              },
              {
                icon: <FaChartLine className="text-green-600 text-xl" />,
                text: "performance analytics",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.15 }}
                whileHover={{ scale: 1.03 }}
                className='flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm cursor-pointer'
              >
                {item.icon}
                <span className='text-gray-700 font-medium'>{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
          className='p-12 bg-white'
        >
          <h2 className='text-3xl font-bold text-gray-800 mb-8'>
            interview setup
          </h2>

          <div className='space-y-6'>
            <div className="relative">
              <FaUserTie className="absolute top-4 left-4 text-gray-400" />
              <input
                type='text'
                placeholder='enter role'
                className='w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition'
                onChange={(e) => setRole(e.target.value)}
                value={role}
              />
            </div>

            <div className="relative">
              <FaUserTie className="absolute top-4 left-4 text-gray-400" />
              <input
                type='text'
                placeholder='enter experience'
                className='w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition'
                onChange={(e) => setExperience(e.target.value)}
                value={experience}
              />
            </div>

            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className='w-full py-3 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition'
            >
              <option value="technical">technical interview</option>
              <option value="HR">HR interview</option>
            </select>
            {skills.length > 0 && (
  <div className="flex flex-wrap gap-2 p-2">
    {skills.map((skill, idx) => (
      <span
        key={idx}
        className="bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full"
      >
        {skill}
      </span>
    ))}
  </div>
)}
            {!analysisDone && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                onClick={() => document.getElementById("resumeUpload").click()}
                className='border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-500 transition'
              >
                <FaFileUpload className='text-4xl mx-auto text-green-600 mb-3' />

                <input
                  type="file"
                  accept="application/pdf"
                  id="resumeUpload"
                  className='hidden'
                  onChange={(e) => setResumeFile(e.target.files[0])}
                />

                <p className='text-gray-600 font-medium'>
                  {resumeFile ? resumeFile.name : "click"}
                </p>
                {resumeFile && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={(e) => { e.stopPropagation(); handleUploadResume(); }}
                    className='mt-4 bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition'
                  >
                    {analyzing ? "Analyzing..." : "Analyze Resume"}
                  </motion.button>
                )}
              </motion.div>
            )}

            <motion.button
              disabled={!role || !experience || loading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              className='w-full disabled:bg-gray-600 bg-green-600 hover:bg-green-700 text-white py-3 rounded-full text-lg font-semibold transition duration-300 shadow-md'
            >
              {loading ? "starting..." : "start interview"}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default SetUp;