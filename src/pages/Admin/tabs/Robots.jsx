import React, { useEffect, useState } from "react";
import { onValue, ref, update } from "firebase/database";
import { rtdb } from "../../../firebase";
import { buildRobotReset, normalizeRobot } from "../../../data/robotProtocol";

const statusClasses = (robot) => {
  if (!robot.isOnline) return "text-red-400 bg-red-400";
  if (robot.status === "delivering") return "text-blue-400 bg-blue-400";
  if (robot.status === "docked") return "text-green-400 bg-green-400";
  return "text-yellow-400 bg-yellow-400";
};

function RobotsTab() {
  const [robots, setRobots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleReset = async (id) => {
    const confirmReset = window.confirm(
      `Are you sure you want to reset Robot ${id.toUpperCase()}?`,
    );
    if (!confirmReset) return;

    try {
      const robotRef = ref(rtdb, `robots/${id}`);
      await update(robotRef, buildRobotReset());
      alert(`Robot ${id.toUpperCase()} has been reset.`);
    } catch (error) {
      console.error("Error resetting robot:", error);
      alert("Failed to reset robot.");
    }
  };

  useEffect(() => {
    const robotsRef = ref(rtdb, "robots");
    const unsubscribe = onValue(robotsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setRobots([]);
        setIsLoading(false);
        return;
      }

      const fleetData = Object.keys(data).map((key) =>
        normalizeRobot(key, data[key]),
      );
      setRobots(fleetData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getStats = () => {
    const total = robots.length;
    const active = robots.filter((robot) => robot.status === "delivering").length;
    const avgBattery = total
      ? Math.round(
          robots.reduce((sum, robot) => sum + (robot.battery || 0), 0) / total,
        )
      : 0;
    const issues = robots.filter(
      (robot) => !robot.isOnline || robot.health.toLowerCase() !== "optimal",
    ).length;

    return { total, active, avgBattery, issues };
  };

  const stats = getStats();

  return (
    <div className="w-full text-left">
      <header className="mb-10 text-left border-l-8 border-red-600 pl-8">
        <h2 className="text-5xl font-black text-gray-900 mb-2 tracking-tighter uppercase italic">
          Fleet
        </h2>
        <p className="text-gray-500 text-xs font-black uppercase tracking-[0.3em]">
          Real-time telemetry and task tracking - RTDB
        </p>
      </header>

      {isLoading ? (
        <div className="py-20 text-center animate-pulse text-gray-500 font-bold uppercase tracking-widest">
          Syncing with fleet...
        </div>
      ) : robots.length === 0 ? (
        <div className="py-20 text-center bg-[#2A2A2D] rounded-[40px] border border-dashed border-white/5">
          <span className="text-5xl block mb-4 text-white font-black">BOT</span>
          <p className="text-gray-400 font-bold text-lg">No robots connected.</p>
          <p className="text-gray-500 text-sm mt-1">
            Connect your units to the `robots` node in Realtime Database.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-[#2A2A2D] p-6 rounded-[32px] border border-white/5 shadow-2xl">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                Active Units
              </p>
              <p className="text-3xl font-black text-white">
                {stats.active} / {stats.total}
              </p>
            </div>
            <div className="bg-[#2A2A2D] p-6 rounded-[32px] border border-white/5 shadow-2xl">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                Fleet Battery
              </p>
              <p
                className={`text-3xl font-black ${stats.avgBattery < 30 ? "text-red-500" : "text-yellow-500"}`}
              >
                {stats.avgBattery}%
              </p>
            </div>
            <div className="bg-[#2A2A2D] p-6 rounded-[32px] border border-white/5 shadow-2xl">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                Issues Detected
              </p>
              <p
                className={`text-3xl font-black ${stats.issues > 0 ? "text-red-500" : "text-green-400"}`}
              >
                {stats.issues}
              </p>
            </div>
            <div className="bg-[#2A2A2D] p-6 rounded-[32px] border border-white/5 shadow-2xl">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                Fleet Status
              </p>
              <p className="text-3xl font-black text-blue-400">
                {stats.issues > 0 ? "Action Req." : "Healthy"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {robots.map((robot) => (
              <div
                key={robot.id}
                className="bg-[#2A2A2D] p-6 rounded-[32px] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-6 flex-1">
                  <div className="w-16 h-16 bg-[#1A1A1D] rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-inner">
                    {robot.status === "maintenance" ? "FIX" : "BOT"}
                  </div>
                  <div>
                    <h4 className="font-black text-white text-lg leading-tight">
                      {robot.name}
                    </h4>
                    <p className="text-[#6539A3] text-xs font-black uppercase tracking-widest">
                      ID: {robot.id.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap md:flex-nowrap items-center gap-8 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                  <div className="text-left">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">
                      Status
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border border-current bg-opacity-10 ${statusClasses(
                        robot,
                      )}`}
                    >
                      {robot.isOnline ? robot.status : "offline"}
                    </span>
                  </div>

                  <div className="text-left min-w-[140px]">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">
                      Current Task
                    </p>
                    <p className="text-sm font-bold text-gray-300">
                      {robot.currentTask}
                    </p>
                  </div>

                  <div className="text-left min-w-[120px]">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">
                      Battery
                    </p>
                    <div className="h-2 w-full bg-[#1A1A1D] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${
                          robot.battery < 20
                            ? "bg-red-500"
                            : robot.battery < 50
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{ width: `${robot.battery}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-left">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">
                      Health
                    </p>
                    <p
                      className={`text-sm font-black uppercase ${
                        robot.health.toLowerCase() === "optimal"
                          ? "text-green-400"
                          : "text-red-500"
                      }`}
                    >
                      {robot.health}
                    </p>
                  </div>

                  <div className="text-left">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">
                      Last Seen
                    </p>
                    <p className="text-xs font-bold text-gray-400">
                      {robot.lastSeenAt
                        ? new Date(robot.lastSeenAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : "Never"}
                    </p>
                  </div>

                  <div className="text-left pl-4 border-l border-white/10 flex flex-col gap-2">
                    <a
                      href={`/robot/${robot.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-black text-white bg-[#6539A3] px-3 py-2 rounded-lg hover:bg-[#7a4bc0] transition-all uppercase tracking-widest shadow-lg active:scale-95 flex items-center justify-center gap-1"
                    >
                      Track <span>-&gt;</span>
                    </a>
                    <button
                      onClick={() => handleReset(robot.id)}
                      className="text-[10px] font-black text-gray-400 border border-white/10 px-3 py-2 rounded-lg hover:bg-white/5 transition-all uppercase tracking-widest"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default RobotsTab;
