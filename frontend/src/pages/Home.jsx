import React, { useState, useEffect } from 'react';
import AuthModel from "../components/AuthModel";
import Navbar from '../components/Navbar';
import { useSelector } from 'react-redux';
import { motion } from 'motion/react';
import Footer from "../components/Footer";
import axios from 'axios';
import {
  BsRobot,
  BsMic,
  BsClock,
  BsBarChart,
  BsFileEarmarkText,
} from 'react-icons/bs';
import { HiSparkles } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import hrImg from "../assets/source/HR.png";
import techImg from "../assets/source/tech.png";
import confidenceImg from "../assets/source/confi.png";
import creditImg from "../assets/source/credit.png";
import evalImg from "../assets/source/ai-ans.png";
import resumeImg from "../assets/source/resume.png";
import pdfImg from "../assets/source/pdf.png";
import analyticsImg from "../assets/source/history.png";
import { ServerUrl } from '../App.jsx';
import BuyCredits from '../components/BuyCredits.jsx';

// Must match the backend check in generateQuestion (Interview.controller.js:
// "if (user.credits < 50)"). If that number ever changes on the backend,
// change it here too or this warning will fire at the wrong threshold.
const CREDITS_PER_INTERVIEW = 50;

function Home() {
  const { userData } = useSelector((state) => state.user)
  const [showAuth, setShowAuth] = useState(false);
  const [showCreditWarning, setShowCreditWarning] = useState(false);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [latestInterview, setLatestInterview] = useState(null);
  const navigate = useNavigate();

  // Pulls the user's real most-recent interview (score/status) so the
  // "Performance" and "Reports" cards can show an actual summary line
  // instead of made-up placeholder text. Only runs when logged in.
  useEffect(() => {
    if (!userData) {
      setLatestInterview(null);
      return;
    }
    const fetchLatest = async () => {
      try {
        const result = await axios.get(
          `${ServerUrl}/api/interview/my-interviews`,
          { withCredentials: true }
        );
        const list = result.data || [];
        setLatestInterview(list.length > 0 ? list[0] : null);
      } catch (error) {
        console.log(error);
        setLatestInterview(null);
      }
    };
    fetchLatest();
  }, [userData]);

  // Central place that decides where each nav card / button goes.
  // If the user isn't logged in, everything opens the auth modal instead.
  const goTo = (path) => {
    if (!userData) {
      setShowAuth(true);
      return;
    }
    navigate(path);
  };

  // Gate for "Start Interview" specifically. Checked BEFORE navigating,
  // so a user with insufficient credits never reaches /interviewPage at
  // all — they stay on the homepage with a warning instead.
  const handleStartInterview = () => {
    if (!userData) {
      setShowAuth(true);
      return;
    }
    if ((userData.credits ?? 0) < CREDITS_PER_INTERVIEW) {
      setShowCreditWarning(true);
      return;
    }
    navigate('/interviewPage');
  };

  const handleReportsClick = () => {
    if (!userData) {
      setShowAuth(true);
      return;
    }
    if (latestInterview && latestInterview._id) {
      navigate(`/interview/report/${latestInterview._id}`);
    } else {
      navigate('/history');
    }
  };

  return (
    <div className='min-h-screen bg-[#d3d3d3] flex flex-col'>
      <Navbar />
      
      <div className='flex-1 px-6 py-20'>
        <div className='flex justify-center mb-8'>
          <div className='bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-full flex items-center gap-2'>
            <HiSparkles size={16} className='bg-green-50 text-green-600' />
            AI Powered Smart Interview Platform
          </div>
        </div>

        <div className='text-center mb-12'>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='text-4xl md:text-6xl font-semibold leading-tight max-w-4xl mx-auto'
          >
            Practice Interviews with
            <span className='relative inline-block'>
              <span className='bg-green-100 text-green-600 rounded-full'>
                AI Intelligence
              </span>
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className='text-gray-500 mt-6 max-w-2xl mx-auto text-lg'
          >
            role based mock interviews with smart follow-ups, adaptive difficult and real time performance evaluation.
          </motion.p>
        </div>

        {/* NEW: the two buttons you asked for */}
        <div className='flex flex-col sm:flex-row justify-center items-center gap-4 mb-28'>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleStartInterview}
            className='bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-md transition'
          >
            Start Interview
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => goTo('/history')}
            className='border-2 border-green-600 text-green-600 hover:bg-green-50 px-8 py-3 rounded-full text-lg font-semibold transition'
          >
            Interview History
          </motion.button>
        </div>

        <div className='flex flex-col md:flex-row justify-center items-center gap-10 mb-28'>
        {
          [
            {
              icon: <BsRobot size={24} />,
              step:"Step 1",
              title:"role & experience selection",
              desc:"AI adjusts difficulty based on selected job role"
            },
            {
              icon:<BsMic size={24}/>,
              step:"Step 2",
              title:"voice interview with AI avatar",
              desc:"Speak naturally – AI understands and responds like a human interviewer",  
            },
            {
              icon: <BsBarChart size={24} />,
              step:"Step 3",
              title:"real-time evaluation",
              desc:"AI analyzes your response instantly and gives feedback on clarity, confidence, and correctness"
            },
            {
              icon:<BsFileEarmarkText size={24}/>,
              step:"Step 4",
              title:"summary & improvement suggestions",
              desc:"Get detailed feedback on what you did well and areas to improve"
            }
          ].map((item, index)=>(
            <motion.div key={index} 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            whileHover={{scale: 1.02}}
            className={`relative bg-white rounded-3xl border-2 border-green-100 hover:border-green-500 p-10 w-80 max-w-[90%] shadow-md hover:shadow-2xl 
              transition-all duration-300
              ${index === 0 ? "rotate-[-4deg]" : ""}
              ${index === 1 ? "rotate-[3deg] md:-mt-6 shadow-xl" : ""}
              ${index === 2 ? "md:-mt-12 shadow-2xl" : ""}
              ${index === 3 ? "rotate-[-4deg]" : ""}
                `}>
              <div className={`
              absolute top-0 left-0 w-2 h-2 bg-green-400 rounded-full shadow-lg
              `}></div>
              <div className='bg-green-50 text-green-600 w-14 h-14 rounded-full flex items-center justify-center mb-6 shadow-sm'>
                {item.icon}
              </div>
              <div>
                <div className='text-xs text-green-600 font-bold mb-2 tracking-wider uppercase'>{item.step}</div>
                <h3 className='text-xl font-bold mb-3 text-gray-800 capitalize'>{item.title}</h3>
                <p className='text-gray-500 text-sm leading-relaxed'>{item.desc}</p>
              </div>
            </motion.div>
          ))
        }
      </div>

      </div>
      <div className='flex flex-col md:flex-row justify-center items-center gap-10 mb-28'>
        {
          [
            {
              icon: <BsRobot size={24} />,
              step:"Step 1",
              title:"start interview",
              desc:"Begin a new AI-powered mock interview session",
              onClick: handleStartInterview,
            },
            {
              icon:<BsMic size={24}/>,
              step:"Step 2",
              title:"Interview History",
              desc:"Review your past interviews and track progress",
              onClick: () => goTo('/history'),
            },
            {
              icon: <BsBarChart size={24} />,
              step:"Step 3",
              title:"Performance",
              // NOTE: there is no separate performance/analytics endpoint
              // built yet — this points at History for now since that's
              // the only real data source that exists. Tell me if you
              // want a dedicated analytics page and I'll scope it.
              desc: latestInterview
                ? `Last score: ${latestInterview.finalScore ?? 0}/10 (${latestInterview.status})`
                : "View detailed analytics and improvement areas",
              onClick: () => goTo('/history'),
            },
            {
              icon:<BsFileEarmarkText size={24}/>,
              step:"Step 4",
              title:"Reports",
              desc: latestInterview
                ? `Open your latest report (${latestInterview.role || 'interview'})`
                : "Get detailed feedback on what you did well and areas to improve",
              onClick: handleReportsClick,
            }
          ].map((item, index)=>(
            <motion.div key={index} 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            whileHover={{scale: 1.02}}
            onClick={item.onClick}
            role="button"
            tabIndex={0}
            className={`relative bg-white rounded-3xl border-2 border-green-100 hover:border-green-500 p-10 w-80 max-w-[90%] shadow-md hover:shadow-2xl 
              transition-all duration-300 cursor-pointer
              ${index === 0 ? "rotate-[-4deg]" : ""}
              ${index === 1 ? "rotate-[3deg] md:-mt-6 shadow-xl" : ""}
              ${index === 2 ? "md:-mt-12 shadow-2xl" : ""}
              ${index === 3 ? "rotate-[-4deg]" : ""}
                `}>
              <div className={`
              absolute top-0 left-0 w-2 h-2 bg-green-400 rounded-full shadow-lg
              `}></div>
              <div className='bg-green-50 text-green-600 w-14 h-14 rounded-full flex items-center justify-center mb-6 shadow-sm'>
                {item.icon}
              </div>
              <div>
                <div className='text-xs text-green-600 font-bold mb-2 tracking-wider uppercase'>{item.step}</div>
                <h3 className='text-xl font-bold mb-3 text-gray-800 capitalize'>{item.title}</h3>
                <p className='text-gray-500 text-sm leading-relaxed'>{item.desc}</p>
              </div>
            </motion.div>
          ))
        }
      </div>
       <div className='mb-32'>
        <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className='text-3xl md:text-4xl font-semibold text-center mb-10'>Advanced AI Features{""}
        <span className="text-green-600"> capabilities</span>
        </motion.h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {
            [
              {
                image:evalImg,
                icon:<BsBarChart size={24}/>,
                title:"AI Answer Evaluation",
                desc:"scores communication, technical accuracy, and overall performance to provide actionable feedback for improvement."
              },
              {
                image:resumeImg,
                icon:<BsFileEarmarkText size={24}/>,
                title:"Resume Analysis",
                desc:"Get detailed feedback on your resume and improve your chances of landing interviews."
              },
              {
                image:pdfImg,
                icon:<BsFileEarmarkText size={24}/>,
                title:"PDF Report Generation",
                desc:"Download detailed feedback reports in PDF format for easy sharing and reference."
              }
            ].map((item, index)=>(
              <motion.div key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{scale: 1.02}}
              className='bg-white border border-gray-200 rounded-3xl p-6 shadow-md hover:shadow-lg transition-all duration-300'>
                <div className='flex flex-col md:flex-row items-center gap-4 mb-4'>
                  <div className='w-full md:w-1/3 flex justify-center'>
                    <img src={item.image} alt={item.title} className='w-24 h-24 object-contain' />
                  </div>

                  <div className='w-full md:w-2/3'>
                    <div className='bg-green-50 text-green-600 w-12 h-12 rounded-xl flex items-center justify-center mb-2'>
                      {item.icon}
                    </div>
                    <h3 className='text-lg font-semibold mb-2 text-gray-800'>{item.title}</h3>
                    <p className='text-gray-500 text-sm leading-relaxed'>{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))
          }
      </div>
       </div>
       <div className='mb-32'>
        <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className='text-3xl md:text-4xl font-semibold text-center mb-10'>Multiple interviews {""}
        <span className="text-green-600">Modes</span>
        </motion.h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {
            [
              {
                img:hrImg,
                title:"HR Interview",
                desc:"Simulate a realistic HR interview experience with AI-driven questions and feedback."
              },
              {
                img:techImg,
                title:"Technical Interview",
                desc:"Engage in a technical interview with AI-generated questions and receive instant feedback."
              },
              {
               img:confidenceImg,
                title:"Confidence Interview",
                desc:"Practice your communication skills and boost your confidence with AI-guided interviews."
              },
            ].map((item, index)=>(
              <motion.div key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{y : -6}}
              className='bg-white border border-gray-200 rounded-3xl p-6 shadow-md hover:shadow-lg transition-all duration-300'>
                <div className='flex flex-col md:flex-row items-center gap-4 mb-4'>
                  <div className='w-full md:w-1/3 flex justify-center'>
                    <img src={item.img} alt={item.title} className='w-24 h-24 object-contain' />
                  </div>

                  <div className='w-full md:w-2/3'>
                    <div className='bg-green-50 text-green-600 w-12 h-12 rounded-xl flex items-center justify-center mb-2'>
                      <div className='w-full md:w-1/3 flex justify-center'>
                      <img src={item.img} alt={item.title} className='w-24 h-24 object-contain' />
                      </div>
                    </div>
                    <h3 className='text-lg font-semibold mb-2 text-gray-800'>{item.title}</h3>
                    <p className='text-gray-500 text-sm leading-relaxed'>{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))
          }
      </div>
       </div>
    {showAuth && <AuthModel onClose={() => setShowAuth(false)}/>}

    {showCreditWarning && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Not enough credits
          </h2>
          <p className="text-gray-500 mb-6">
            You need at least {CREDITS_PER_INTERVIEW} credits to start an interview.
            {userData ? ` You currently have ${userData.credits ?? 0}.` : ""}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreditWarning(false)}
              className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-full font-semibold hover:bg-gray-50 transition"
            >
              Close
            </button>
            <button
              onClick={() => {
                setShowCreditWarning(false);
                setShowBuyCredits(true);
              }}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-full font-semibold transition"
            >
              Buy Credits
            </button>
          </div>
        </div>
      </div>
    )}

    {showBuyCredits && <BuyCredits onClose={() => setShowBuyCredits(false)} />}

      <Footer />
  </div>  
  
  );
    
}

export default Home;