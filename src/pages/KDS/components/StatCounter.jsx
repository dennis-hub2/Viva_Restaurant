import React from "react";

const StatCounter = ({ label, count, color }) => (
  <div className="flex flex-col items-center">
    <span className="text-xl font-black">{count}</span>
    <div className="flex items-center gap-2 text-xs text-gray-400">
      <span className={`w-2 h-2 rounded-full ${color}`}></span>
      {label}
    </div>
  </div>
);

export default StatCounter;
