import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { onValue } from "firebase/database";
import { doc, updateDoc } from "firebase/firestore";
import { rtdb, db, ref, update } from "../../firebase";
import { robotPaths } from "../../data/robotNavigation";

const RobotTracker = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [robot, setRobot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const robotRef = ref(rtdb, `robots/${id}`);
    
    let previousStatus = null;

    const unsubscribe = onValue(robotRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setRobot({ id, ...data });

        // --- Notification Logic ---
        if (data.status === "arrived" && previousStatus !== "arrived") {
          // 1. Browser Notification
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Robot Arrived! 🤖", {
              body: `${data.name || "Unit"} is at Table ${data.currentTable || "?"}.`,
              icon: "/vite.svg"
            });
          }
          
          // 2. Play a sound if possible (optional but good)
          try {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            audio.play();
          } catch (e) { console.error("Audio play failed", e); }
        }
        previousStatus = data.status;
      } else {
        setRobot(null);
      }
      setIsLoading(false);
    });

    // Request Notification Permission on mount
    if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission();
    }

    return () => unsubscribe();
  }, [id]);

  const handleDelivered = async () => {
    if (!robot || !robot.currentTable) return;
    
    const tableNum = Number(robot.currentTable);
    const returnPath = robotPaths[tableNum]?.returning || [];

    try {
      // 1. Update Robot in RTDB
      const robotRef = ref(rtdb, `robots/${id}`);
      await update(robotRef, {
        status: "returning",
        progress: 0,
        currentPath: returnPath,
        currentTask: "Returning to Kitchen",
        command: "RETURN_TO_KITCHEN",
        key: "Swagger" // Security key for RTDB write rules
      });

      // 2. Update Order in Firestore (if lastOrderId exists)
      if (robot.lastOrderId) {
        const orderRef = doc(db, "orders", robot.lastOrderId);
        await updateDoc(orderRef, {
          status: "delivered",
          deliveredAt: new Date().toISOString()
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
        <span className="text-6xl mb-6">🛰️</span>
        <h2 className="text-2xl font-black text-white mb-2">Robot Not Found</h2>
        <p className="text-gray-400 mb-8">We couldn't find a robot with ID: {id}</p>
        <button 
          onClick={() => navigate("/")}
          className="bg-[#6539A3] text-white px-8 py-3 rounded-2xl font-bold shadow-lg"
        >
          Return Home
        </button>
      </div>
    );
  }

  const progress = robot.progress || 0;
  const isArrived = robot.status === "arrived";
  const isReturning = robot.status === "returning";

  return (
    <div className="min-h-screen bg-[#1A1A1D] text-white p-6 font-sans">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <button 
            onClick={() => navigate("/")}
            className="w-10 h-10 bg-[#2A2A2D] rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            ←
          </button>
          <div className="text-right">
            <h1 className="text-xl font-black tracking-tight leading-none">{robot.name || "Unit"}</h1>
            <p className="text-[10px] text-[#6539A3] font-black uppercase tracking-widest mt-1">ID: {id.toUpperCase()}</p>
          </div>
        </header>

        {/* Status Card */}
        <div className="bg-[#2A2A2D] rounded-[40px] p-8 border border-white/5 shadow-2xl mb-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-8 bg-[#1A1A1D] rounded-full overflow-hidden border border-white/10">
                <div 
                  className={`h-full ${robot.battery < 20 ? 'bg-red-500' : 'bg-green-500'}`} 
                  style={{ width: `${robot.battery || 0}%` }}
                />
              </div>
              <span className="text-[10px] font-black text-gray-500">{robot.battery || 0}%</span>
            </div>
          </div>

          <div className="w-24 h-24 bg-[#1A1A1D] rounded-3xl flex items-center justify-center text-5xl mx-auto mb-6 shadow-inner relative">
            {isReturning ? '🏠' : isArrived ? '🎁' : '🤖'}
            {robot.status === 'delivering' && (
              <div className="absolute inset-0 border-4 border-[#6539A3] border-t-transparent rounded-3xl animate-spin"></div>
            )}
          </div>

          <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-tight">
            {robot.status || "Disconnected"}
          </h2>
          <p className="text-gray-400 font-medium text-sm">
            {robot.currentTask || "Standby Mode"}
          </p>
        </div>

        {/* Progress Section */}
        <div className="space-y-4 mb-12">
          <div className="flex justify-between items-end px-2">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Movement Progress</span>
            <span className="text-2xl font-black text-[#6539A3] leading-none">{progress}%</span>
          </div>
          
          <div className="h-4 w-full bg-[#2A2A2D] rounded-full overflow-hidden p-1 border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-[#6539A3] to-[#4B1E83] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="flex justify-between px-2 text-[9px] font-black text-gray-600 uppercase tracking-tighter">
            <span>Kitchen</span>
            <span>Table {robot.currentTable || "?"}</span>
          </div>
        </div>

        {/* Action Button */}
        {isArrived && (
          <button
            onClick={handleDelivered}
            className="w-full bg-[#6539A3] text-white font-black text-xl py-6 rounded-[32px] shadow-[0px_8px_0px_#4B1E83] hover:translate-y-[2px] hover:shadow-[0px_6px_0px_#4B1E83] transition-all active:translate-y-[8px] active:shadow-none animate-bounce"
          >
            Food Delivered
          </button>
        )}

        {isReturning && (
          <div className="text-center py-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
            <p className="text-blue-400 font-bold text-sm">Robot is returning to base...</p>
          </div>
        )}

        {!isArrived && !isReturning && robot.status !== "docked" && (
          <p className="text-center text-gray-500 text-xs italic">
            Waiting for robot to arrive at destination...
          </p>
        )}
      </div>
    </div>
  );
};

export default RobotTracker;
