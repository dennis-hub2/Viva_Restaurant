import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function RobotAccess() {
  const navigate = useNavigate();
  const [robotId, setRobotId] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const cleanId = robotId.trim().toLowerCase();
    if (!cleanId) return;
    navigate(`/robot/${cleanId}`);
  };

  return (
    <div className="min-h-screen bg-[#111114] text-white flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <div className="bg-[#1A1A1D] border border-white/5 shadow-2xl rounded-[40px] p-8 md:p-10">
          <div className="mb-8">
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[#6539A3] mb-3">
              Robot Tracking
            </p>
            <h1 className="text-4xl font-black tracking-tight leading-none mb-3">
              Enter Robot ID
            </h1>
            <p className="text-sm text-gray-400 leading-6">
              Use this standalone tracker page to monitor any delivery robot in
              real time. Enter the robot ID.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="robot-id"
                className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-3"
              >
                Robot ID
              </label>
              <input
                id="robot-id"
                type="text"
                value={robotId}
                onChange={(event) => setRobotId(event.target.value)}
                placeholder="swagbot01"
                autoComplete="off"
                className="w-full rounded-[24px] bg-[#101013] border border-white/10 px-5 py-4 text-lg font-bold text-white outline-none focus:border-[#6539A3] focus:ring-2 focus:ring-[#6539A3]/30 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={!robotId.trim()}
              className="w-full bg-[#6539A3] disabled:bg-[#6539A3]/40 disabled:cursor-not-allowed text-white font-black text-lg py-4 rounded-[24px] shadow-[0px_8px_0px_#4B1E83] hover:translate-y-[2px] hover:shadow-[0px_6px_0px_#4B1E83] transition-all active:translate-y-[8px] active:shadow-none"
            >
              Open Live Tracker
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RobotAccess;
