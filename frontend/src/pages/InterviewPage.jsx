import React, { useState } from "react";
import SetUp from "../components/SetUp.jsx"; // adjust path to match your project structure
import Interview from "../components/Interview.jsx"; // adjust path to match your project structure

function InterviewPage() {
  // interviewData starts as null. SetUp's onStart() fills it in.
  // Interview is only rendered once this actually has data.
  const [interviewData, setInterviewData] = useState(null);

  const handleStart = (data) => {
    setInterviewData(data);
  };

  const handleFinish = (resultData) => {
    // Decide what happens after the interview finishes.
    // e.g. reset back to setup, or navigate to a results page.
    setInterviewData(null);
  };

  if (!interviewData) {
    return <SetUp onStart={handleStart} />;
  }

  return <Interview interviewData={interviewData} onFinish={handleFinish} />;
}

export default InterviewPage;