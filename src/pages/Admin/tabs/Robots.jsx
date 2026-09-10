import React, { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { rtdb } from "../../../firebase";
import {
  getTableLabel,
  getDestinationTable,
  normalizeRobot,
  ROBOT_ID,
  TABLES,
  TRIP_STATUSES,
} from "../../../data/robotProtocol";

const statusClasses = {
  [TRIP_STATUSES.DOCKING]: "text-emerald-800 bg-emerald-100 border-emerald-300",
  [TRIP_STATUSES.EN_ROUTE]: "text-blue-800 bg-blue-100 border-blue-300",
  [TRIP_STATUSES.ARRIVED]: "text-amber-800 bg-amber-100 border-amber-300",
  [TRIP_STATUSES.RETURNING]: "text-purple-800 bg-purple-100 border-purple-300",
};

function RobotsTab() {
  const [robot, setRobot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const robotRef = ref(rtdb, ROBOT_ID);
    const unsubscribe = onValue(
      robotRef,
      (snapshot) => {
        setRobot(snapshot.exists() ? normalizeRobot(snapshot.val()) : null);
        setErrorMsg(null);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error subscribing to robot state:", error);
        setErrorMsg(error.message || "Failed to load robot state.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const destinationTable = robot ? getDestinationTable(robot) : null;

  return (
    <div className="w-full text-left">
      <header className="mb-8 text-left border-l-8 border-gray-900 pl-6">
        <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-1 tracking-tighter uppercase italic">
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
      ) : errorMsg ? (
        <div className="py-16 text-center bg-red-50 rounded-3xl border-2 border-red-200 p-8">
          <p className="text-red-700 font-black text-lg mb-2">Failed to Sync Robot Telemetry</p>
          <p className="text-red-500 font-bold text-xs">{errorMsg}</p>
        </div>
      ) : !robot ? (
        <div className="py-16 text-center bg-white rounded-3xl border-2 border-dashed border-gray-300 p-8">
          <p className="text-gray-500 font-bold text-base">No realtime data found for `{ROBOT_ID}`.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-xs">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Robot ID
              </p>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 italic tracking-tight uppercase">
                {ROBOT_ID}
              </p>
            </div>
            <div className="bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-xs">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Trip Status
              </p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                  statusClasses[robot.tripStatus] || "text-gray-700 bg-gray-100 border-gray-300"
                }`}
              >
                {robot.tripStatus}
              </span>
            </div>
            <div className="bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-xs">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Current Location
              </p>
              <p className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {getTableLabel(robot.currentLocation)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-xs">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Target Destination
              </p>
              <p className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {destinationTable ? getTableLabel(destinationTable) : "None (Docked)"}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-gray-200 shadow-xs">
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
              <div>
                <p className="text-xl font-black text-gray-900 tracking-tight uppercase italic">
                  Live Station Statuses
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  Realtime station state for `{ROBOT_ID}`.
                </p>
              </div>
              <span
                className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  statusClasses[robot.tripStatus] || "text-gray-700 bg-gray-100 border-gray-300"
                }`}
              >
                {robot.tripStatus}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TABLES.map((tableName) => {
                const table = robot.tables[tableName];
                const isDestination = table.mission === "destination";
                const isCurrent = robot.currentLocation === tableName;

                return (
                  <div
                    key={tableName}
                    className={`rounded-2xl border-2 p-5 transition-all ${
                      isDestination
                        ? "border-amber-500 bg-amber-50"
                        : isCurrent
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-lg font-black text-gray-900 italic">
                        {getTableLabel(tableName)}
                      </p>
                      {isDestination && (
                        <span className="text-[9px] font-black text-amber-800 bg-amber-200 border border-amber-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Active Target
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-gray-700 bg-white p-3 rounded-xl border border-gray-200">
                      <div>
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest block font-black">Mission</span>
                        <span>{table.mission}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest block font-black">Arrived</span>
                        <span className={table.arrived ? "text-emerald-600" : "text-gray-500"}>{String(table.arrived)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest block font-black">Status</span>
                        <span>{String(table.status)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest block font-black">Confirmed</span>
                        <span className={table.confirmed ? "text-emerald-600" : "text-gray-500"}>{String(table.confirmed)}</span>
                      </div>
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
