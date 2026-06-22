import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { onValue } from "firebase/database";
import { db, ref, rtdb, update } from "../../firebase";
import { robotPaths } from "../../data/robotNavigation";
import {
  buildRobotCommand,
  COMMANDS,
  normalizeRobot,
  STATUSES,
} from "../../data/robotProtocol";

function RobotTracker() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [robot, setRobot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const previousStatusRef = useRef(null);

  useEffect(() => {
    const robotRef = ref(rtdb, `robots/${id}`);

    const unsubscribe = onValue(robotRef, (snapshot) => {
      if (!snapshot.exists()) {
        setRobot(null);
        setIsLoading(false);
        return;
      }

      const nextRobot = normalizeRobot(id, snapshot.val());
      setRobot(nextRobot);

      if (
        nextRobot.status === STATUSES.ARRIVED &&
        previousStatusRef.current !== STATUSES.ARRIVED
      ) {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Robot Arrived", {
            body: `${nextRobot.name} is at Table ${nextRobot.currentTable || "?"}.`,
            icon: "/vite.svg",
          });
        }

        try {
          const audio = new Audio(
            "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
          );
          audio.play().catch(() => {});
        } catch {
          // Non-blocking feedback only.
        }
      }

      previousStatusRef.current = nextRobot.status;
      setIsLoading(false);
    });

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    return () => unsubscribe();
  }, [id]);

  const handleDelivered = async () => {
    if (!robot || !robot.currentTable) return;

    const tableNum = Number(robot.currentTable);
    const returnPath = robotPaths[tableNum]?.returning || [];

    try {
      const robotRef = ref(rtdb, `robots/${id}`);
      await update(
        robotRef,
        buildRobotCommand(COMMANDS.RETURN_TO_KITCHEN, {
          status: STATUSES.RETURNING,
          progress: 0,
          currentPath: returnPath,
          currentTask: "Returning to Kitchen",
        }),
      );

      if (robot.lastOrderId) {
        const orderRef = doc(db, "orders", robot.lastOrderId);
        await updateDoc(orderRef, {
          status: "completed",
          deliveredAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error sending robot back:", error);
      alert("Failed to send command to robot. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A1D] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#6539A3]"></div>
      </div>
    );
  }

  if (!robot) {
    return (
      <div className="min-h-screen bg-[#1A1A1D] flex flex-col items-center justify-center p-6 text-center">
        <span className="text-6xl mb-6">Signal Lost</span>
        <h2 className="text-2xl font-black text-white mb-2">Robot Not Found</h2>
        <p className="text-gray-400 mb-8">No realtime data was found for `{id}`.</p>
        <button
          onClick={() => navigate("/robot")}
          className="bg-[#6539A3] text-white px-8 py-3 rounded-2xl font-bold shadow-lg"
        >
          Return Home
        </button>
      </div>
    );
  }

  const isArrived = robot.status === STATUSES.ARRIVED;
  const isReturning = robot.status === STATUSES.RETURNING;
  const lastSeenLabel = robot.lastSeenAt
    ? new Date(robot.lastSeenAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "Never";

  return (
    <div className="min-h-screen bg-[#1A1A1D] text-white p-6 font-sans">
      <div className="max-w-md mx-auto">
        <header className="flex justify-between items-center mb-12">
          <button
            onClick={() => navigate("/robot")}
            className="w-10 h-10 bg-[#2A2A2D] rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            Back
          </button>
          <div className="text-right">
            <h1 className="text-xl font-black tracking-tight leading-none">
              {robot.name}
            </h1>
            <p className="text-[10px] text-[#6539A3] font-black uppercase tracking-widest mt-1">
              ID: {id.toUpperCase()}
            </p>
          </div>
        </header>

        <div className="bg-[#2A2A2D] rounded-[40px] p-8 border border-white/5 shadow-2xl mb-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 space-y-2 text-right">
            <div className="flex items-center gap-2 justify-end">
              <div
                className={`h-2.5 w-2.5 rounded-full ${robot.isOnline ? "bg-green-400" : "bg-red-500"}`}
              ></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {robot.isOnline ? "Online" : "Offline"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-8 bg-[#1A1A1D] rounded-full overflow-hidden border border-white/10">
                <div
                  className={`h-full ${robot.battery < 20 ? "bg-red-500" : "bg-green-500"}`}
                  style={{ width: `${robot.battery}%` }}
                />
              </div>
              <span className="text-[10px] font-black text-gray-500">
                {robot.battery}%
              </span>
            </div>
          </div>

          <div className="w-24 h-24 bg-[#1A1A1D] rounded-3xl flex items-center justify-center text-2xl mx-auto mb-6 shadow-inner relative font-black">
            {isReturning ? "HOME" : isArrived ? "TABLE" : "BOT"}
            {robot.status === STATUSES.DELIVERING && (
              <div className="absolute inset-0 border-4 border-[#6539A3] border-t-transparent rounded-3xl animate-spin"></div>
            )}
          </div>

          <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-tight">
            {robot.status}
          </h2>
          <p className="text-gray-400 font-medium text-sm">{robot.currentTask}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[#2A2A2D] rounded-3xl p-4 border border-white/5">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
              Destination
            </p>
            <p className="text-lg font-black text-white">
              {robot.destination ? `Table ${robot.destination}` : "Kitchen"}
            </p>
          </div>
          <div className="bg-[#2A2A2D] rounded-3xl p-4 border border-white/5">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
              Last Seen
            </p>
            <p className="text-sm font-bold text-white">{lastSeenLabel}</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-end px-2">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              Movement Progress
            </span>
            <span className="text-2xl font-black text-[#6539A3] leading-none">
              {robot.progress}%
            </span>
          </div>

          <div className="h-4 w-full bg-[#2A2A2D] rounded-full overflow-hidden p-1 border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-[#6539A3] to-[#4B1E83] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${robot.progress}%` }}
            />
          </div>

          <div className="flex justify-between px-2 text-[9px] font-black text-gray-600 uppercase tracking-tighter">
            <span>Kitchen</span>
            <span>Table {robot.currentTable || "?"}</span>
          </div>
        </div>

        {robot.lastError && (
          <div className="mb-8 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
            {robot.lastError}
          </div>
        )}

        {isArrived && (
          <button
            onClick={handleDelivered}
            className="w-full bg-[#6539A3] text-white font-black text-xl py-6 rounded-[32px] shadow-[0px_8px_0px_#4B1E83] hover:translate-y-[2px] hover:shadow-[0px_6px_0px_#4B1E83] transition-all active:translate-y-[8px] active:shadow-none"
          >
            Food Delivered
          </button>
        )}

        {isReturning && (
          <div className="text-center py-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
            <p className="text-blue-400 font-bold text-sm">
              Robot is returning to base.
            </p>
          </div>
        )}

        {!isArrived && !isReturning && robot.status !== STATUSES.DOCKED && (
          <p className="text-center text-gray-500 text-xs italic">
            Live telemetry is active. Waiting for the robot to reach its next state.
          </p>
        )}
      </div>
    </div>
  );
}

export default RobotTracker;
