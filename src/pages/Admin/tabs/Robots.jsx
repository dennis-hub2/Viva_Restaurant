import React, { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { rtdb } from "../../../firebase";
import {
  getTableLabel,
  normalizeRobot,
  ROBOT_ID,
  TABLES,
  TRIP_STATUSES,
} from "../../../data/robotProtocol";

const statusClasses = {
  [TRIP_STATUSES.IDLE]: "text-green-400 bg-green-400/10 border-green-400/30",
  [TRIP_STATUSES.EN_ROUTE]: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  [TRIP_STATUSES.WAITING_CONFIRMATION]:
    "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  [TRIP_STATUSES.AWAITING_RETURN]:
    "text-orange-400 bg-orange-400/10 border-orange-400/30",
  [TRIP_STATUSES.RETURNING]: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
};

function RobotsTab() {
  const [robot, setRobot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const robotRef = ref(rtdb, ROBOT_ID);
    const unsubscribe = onValue(robotRef, (snapshot) => {
      setRobot(snapshot.exists() ? normalizeRobot(snapshot.val()) : null);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full text-left">
      <header className="mb-10 text-left border-l-8 border-red-600 pl-8">
        <h2 className="text-5xl font-black text-gray-900 mb-2 tracking-tighter uppercase italic">
          Robot Ops
        </h2>
        <p className="text-gray-500 text-xs font-black uppercase tracking-[0.3em]">
          Live delivery state from Realtime Database
        </p>
      </header>

      {isLoading ? (
        <div className="py-20 text-center animate-pulse text-gray-500 font-bold uppercase tracking-widest">
          Syncing robot state...
        </div>
      ) : !robot ? (
        <div className="py-20 text-center bg-[#2A2A2D] rounded-[40px] border border-dashed border-white/5">
          <p className="text-gray-400 font-bold text-lg">No data found for `{ROBOT_ID}`.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#2A2A2D] p-6 rounded-[32px] border border-white/5 shadow-2xl">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                Robot
              </p>
              <p className="text-3xl font-black text-white">{ROBOT_ID}</p>
            </div>
            <div className="bg-[#2A2A2D] p-6 rounded-[32px] border border-white/5 shadow-2xl">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                Trip Status
              </p>
              <p className="text-2xl font-black text-white">{robot.tripStatus}</p>
            </div>
            <div className="bg-[#2A2A2D] p-6 rounded-[32px] border border-white/5 shadow-2xl">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                Current Location
              </p>
              <p className="text-2xl font-black text-white">
                {getTableLabel(robot.currentLocation)}
              </p>
            </div>
            <div className="bg-[#2A2A2D] p-6 rounded-[32px] border border-white/5 shadow-2xl">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                Route
              </p>
              <p className="text-lg font-black text-white">
                {robot.route.length ? robot.route.map(getTableLabel).join(" -> ") : "None"}
              </p>
            </div>
          </div>

          <div className="bg-[#2A2A2D] p-6 rounded-[32px] border border-white/5 shadow-xl">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-lg font-black text-white">Live Robot State</p>
                <p className="text-sm text-gray-400">
                  Read-only operational view for the `swagbot1` delivery flow.
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  statusClasses[robot.tripStatus] || "text-gray-300 bg-white/5 border-white/10"
                }`}
              >
                {robot.tripStatus}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TABLES.map((tableName) => {
                const table = robot.tables[tableName];
                const inRoute = robot.route.includes(tableName);

                return (
                  <div
                    key={tableName}
                    className={`rounded-[24px] border p-5 ${
                      inRoute
                        ? "border-[#6539A3] bg-[#6539A3]/10"
                        : "border-white/5 bg-[#1A1A1D]"
                    }`}
                  >
                    <p className="text-lg font-black text-white mb-3">{getTableLabel(tableName)}</p>
                    <div className="space-y-1 text-sm text-gray-300">
                      <p>mission: {table.mission}</p>
                      <p>status: {String(table.status)}</p>
                      <p>arrived: {String(table.arrived)}</p>
                      <p>confirmed: {String(table.confirmed)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RobotsTab;
