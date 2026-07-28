import React from 'react'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

function Timer({ timeLeft, totalTime }) {
    const percentage = (timeLeft / totalTime) * 100;

    return (
        <div className="w-32 h-32">
            <CircularProgressbar
                value={percentage}
                text={`${timeLeft}s`}
                styles={buildStyles({
                    textSize: "22px",
                    pathColor: "#10b981",
                    textColor: "#ef4444",
                    trailColor: "#e5e7eb",
                })}
            />
        </div>
    );
}

export default Timer;