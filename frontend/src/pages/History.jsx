import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { ServerUrl } from '../App.jsx';
import BuyCredits from '../components/BuyCredits.jsx';

// NOTE: same threshold as Home.jsx's CREDITS_PER_INTERVIEW, and the
// backend's "if (user.credits < 50)" check in generateQuestion. This is
// now duplicated in two frontend files — if the price ever changes,
// both need updating, or better, extract into a shared constant/hook.
const CREDITS_PER_INTERVIEW = 50;

// Lists the logged-in user's past interviews (role, mode, score, status)
// pulled from GET /api/interview/my-interviews. Clicking a row opens the
// full report for that interview.
function History() {
  const { userData } = useSelector((state) => state.user);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreditWarning, setShowCreditWarning] = useState(false);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const navigate = useNavigate();

  const handleStartInterview = () => {
    if ((userData?.credits ?? 0) < CREDITS_PER_INTERVIEW) {
      setShowCreditWarning(true);
      return;
    }
    navigate('/interviewPage');
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const result = await axios.get(
          `${ServerUrl}/api/interview/my-interviews`,
          { withCredentials: true }
        );
        setInterviews(result.data || []);
      } catch (err) {
        console.log(err);
        setError("Could not load interview history.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className='min-h-screen bg-[#d3d3d3]'>
      <Navbar />
      <div className='max-w-4xl mx-auto px-6 py-16'>
        <h1 className='text-3xl font-bold text-gray-800 mb-2'>Interview History</h1>
        <p className='text-gray-500 mb-8'>
          Every attempt you've made, with your score and status.
        </p>

        {loading && <p className='text-gray-500'>Loading...</p>}
        {error && <p className='text-red-500'>{error}</p>}

        {!loading && !error && interviews.length === 0 && (
          <div className='bg-white rounded-3xl shadow-md p-10 text-center'>
            <p className='text-gray-500 mb-4'>
              You haven't attempted any interviews yet.
            </p>
            <button
              onClick={handleStartInterview}
              className='bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-semibold transition'
            >
              Start your first interview
            </button>
          </div>
        )}

        <div className='space-y-4'>
          {interviews.map((iv) => (
            <div
              key={iv._id}
              onClick={() => navigate(`/interview/report/${iv._id}`)}
              className='bg-white rounded-2xl shadow-md p-6 flex justify-between items-center cursor-pointer hover:shadow-lg transition'
            >
              <div>
                <h3 className='text-lg font-semibold text-gray-800'>{iv.role}</h3>
                <p className='text-sm text-gray-500'>
                  {iv.mode} · {iv.experience} yr experience ·{' '}
                  {new Date(iv.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold text-green-600'>
                  {iv.finalScore ?? 0}/10
                </div>
                <div className='text-xs text-gray-400 capitalize'>{iv.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default History;