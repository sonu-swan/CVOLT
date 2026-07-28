import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { ServerUrl } from '../App.jsx';

function ScoreBar({ label, value }) {
  const pct = Math.min(100, Math.max(0, (value / 10) * 100));
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
        <span>{label}</span>
        <span>{value}/10</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-green-600 h-2.5 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Report() {
  const { interviewId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const result = await axios.get(
          `${ServerUrl}/api/interview/report/${interviewId}`,
          { withCredentials: true }
        );
        setReport(result.data);
      } catch (err) {
        console.log(err);
        setError("Could not load the report. Try again later.");
      } finally {
        setLoading(false);
      }
    };
    if (interviewId) fetchReport();
  }, [interviewId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">{error || "No report data available."}</p>
      </div>
    );
  }

  const {
    finalScore = 0,
    confidence = 0,
    communication = 0,
    correctness = 0,
    questionWiseScore = [],
  } = report;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Interview Report
          </h1>
          <p className="text-gray-500 mb-6">
            Here's how you performed across your questions.
          </p>

          <div className="flex items-center justify-center mb-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600">
                {finalScore}
              </div>
              <div className="text-gray-500 mt-1">Overall Score / 10</div>
            </div>
          </div>

          <ScoreBar label="Confidence" value={confidence} />
          <ScoreBar label="Communication" value={communication} />
          <ScoreBar label="Correctness" value={correctness} />
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Question-wise Breakdown
          </h2>

          {questionWiseScore.length === 0 && (
            <p className="text-gray-500">No question data available.</p>
          )}

          <div className="space-y-6">
            {questionWiseScore.map((q, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-2xl p-5 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-gray-800">
                    Q{index + 1}. {q.question}
                  </p>
                  <span className="ml-4 shrink-0 bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full text-sm">
                    {q.score}/10
                  </span>
                </div>

                {q.answer && (
                  <p className="text-gray-600 text-sm mb-3">
                    <span className="font-medium">Your answer: </span>
                    {q.answer}
                  </p>
                )}

                <p className="text-gray-700 text-sm mb-3 italic">
                  "{q.feedback}"
                </p>

                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  <span>Confidence: {q.confidence}/10</span>
                  <span>Communication: {q.communication}/10</span>
                  <span>Correctness: {q.correctness}/10</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Report;