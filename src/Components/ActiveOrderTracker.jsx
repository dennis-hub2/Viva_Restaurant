import React, { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import { db, rtdb } from "../firebase";

const ActiveOrderTracker = ({ activeOrderId, setActiveOrderId }) => {
  const [activeOrder, setActiveOrder] = useState(null);
  const [robotState, setRobotState] = useState(null);

  // Listen to the customer's active order in Firestore
  useEffect(() => {
    if (!activeOrderId) {
      setActiveOrder(null);
      return;
    }
    const orderRef = doc(db, "orders", activeOrderId);
    const unsubscribe = onSnapshot(orderRef, (docSnap) => {
      if (docSnap.exists()) {
        setActiveOrder({ id: docSnap.id, ...docSnap.data() });
      } else {
        setActiveOrder(null);
      }
    });
    return () => unsubscribe();
  }, [activeOrderId]);

  // Listen to RTDB robot status when order is assigned to a robot
  useEffect(() => {
    if (!activeOrder || !activeOrder.assignedRobot) {
      setRobotState(null);
      return;
    }
    const robotRef = ref(rtdb, activeOrder.assignedRobot);
    const unsubscribe = onValue(robotRef, (snapshot) => {
      if (snapshot.exists()) {
        setRobotState(snapshot.val());
      } else {
        setRobotState(null);
      }
    });
    return () => unsubscribe();
  }, [activeOrder]);

  // Auto-clear active order from memory 10 seconds after it is completed
  useEffect(() => {
    if (activeOrder?.status === "completed") {
      const timer = setTimeout(() => {
        localStorage.removeItem("active_order_id");
        localStorage.removeItem("customer_table_number");
        setActiveOrderId(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [activeOrder, setActiveOrderId]);

  const getOrderProgressInfo = () => {
    if (!activeOrder) return { step: 0, title: "No active order", desc: "" };

    if (activeOrder.status === "new") {
      return {
        step: 1,
        title: "Order Received",
        desc: "Kitchen is preparing to cook your delicious meal.",
        color: "text-amber-400",
      };
    }

    if (activeOrder.status === "progress") {
      return {
        step: 2,
        title: "Chef is Cooking",
        desc: "Your dishes are being prepared fresh in the kitchen.",
        color: "text-orange-400",
      };
    }

    if (activeOrder.status === "ready") {
      const tableKey = `table${activeOrder.table}`;
      const tableState = robotState?.[tableKey];

      // Safe arrival check
      const isArrived =
        tableState?.arrived === true ||
        (robotState?.current_location === tableKey &&
          robotState?.trip_status === "waiting_confirmation");

      // Confirmation is ONLY valid if the robot actually arrived at the table during this trip
      const isConfirmed = tableState?.confirmed === true && isArrived;

      if (isConfirmed) {
        return {
          step: 5,
          title: "Delivered",
          desc: "Delivered successfully. Enjoy your meal!",
          color: "text-emerald-400 font-bold",
        };
      }

      if (isArrived) {
        return {
          step: 4,
          title: "Robot Arrived! 🤖",
          desc: "Swagbot1 is at your table! Please pick up your food.",
          color: "text-emerald-400 font-bold animate-bounce",
        };
      }

      const currentLoc = robotState?.current_location
        ? String(robotState.current_location).replace("table", "Table ")
        : "Docking";

      return {
        step: 3,
        title: "Robot En Route 🤖",
        desc: `Swagbot1 is carrying your food! (Currently passing ${currentLoc})`,
        color: "text-sky-400",
      };
    }

    if (activeOrder.status === "completed") {
      return {
        step: 5,
        title: "Delivered & Confirmed",
        desc: "Enjoy your food! Thank you for dining with us.",
        color: "text-emerald-400 font-bold",
      };
    }

    return {
      step: 1,
      title: "Processing",
      desc: "Updating order information.",
      color: "text-slate-400",
    };
  };

  if (!activeOrder) return null;

  const progressInfo = getOrderProgressInfo();

  return (
    <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 bg-[#2B231E]/95 text-white p-5 rounded-3xl shadow-[0_24px_50px_rgba(0,0,0,0.35)] border border-white/10 z-90 backdrop-blur-md">
      <div className="flex justify-between items-start mb-3 border-b border-white/10 pb-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-cyan-400">Live Order Tracker</p>
          <h4 className="font-bold text-sm text-[#F7E7CE]">Table {activeOrder.table} &bull; Order #{activeOrder.id?.slice(-4)}</h4>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem("active_order_id");
            localStorage.removeItem("customer_table_number");
            setActiveOrderId(null);
          }}
          className="text-xs text-slate-400 hover:text-white transition"
          title="Close Tracker"
        >
          ✕
        </button>
      </div>

      <div className="mb-4">
        <p className={`text-md font-black tracking-tight ${progressInfo.color}`}>{progressInfo.title}</p>
        <p className="text-xs text-slate-300 mt-1">{progressInfo.desc}</p>
      </div>

      {/* Mini Stepper */}
      <div className="flex items-center justify-between gap-1 mt-2.5 relative">
        <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-white/10 -translate-y-1/2 z-0" />
        <div
          className="absolute top-1/2 left-2 h-0.5 bg-linear-to-r from-orange-400 to-emerald-450 -translate-y-1/2 z-0 transition-all duration-500"
          style={{ width: `${Math.max(0, (progressInfo.step - 1) * 25)}%` }}
        />

        {[
          { id: 1, label: "Placed" },
          { id: 2, label: "Cooking" },
          { id: 3, label: "Transit" },
          { id: 4, label: "Arrived" },
          { id: 5, label: "Done" },
        ].map((stepObj) => {
          const isActive = stepObj.id <= progressInfo.step;
          const isCurrent = stepObj.id === progressInfo.step;
          return (
            <div key={stepObj.id} className="flex flex-col items-center z-10 flex-1">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${isCurrent
                    ? "bg-orange-400 text-slate-950 scale-110 shadow-[0_0_12px_rgba(251,146,60,0.5)] border-2 border-white"
                    : isActive
                      ? "bg-emerald-400 text-slate-950"
                      : "bg-neutral-800 text-slate-400 border border-white/5"
                  }`}
              >
                {stepObj.id === 5 && progressInfo.step === 5 ? "✓" : stepObj.id}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-wider mt-1.5 ${isCurrent ? "text-orange-400" : isActive ? "text-slate-200" : "text-slate-500"}`}>
                {stepObj.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Simple Food Summary */}
      <div className="mt-4 pt-3 border-t border-white/10 text-right">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block text-left mb-1">Your Items</span>
        <div className="max-h-20 overflow-y-auto pr-1 text-left text-[11px] text-slate-300 space-y-0.5">
          {activeOrder.items?.map((it, idx) => (
            <div key={idx} className="flex justify-between">
              <span>{it.qty}x {it.name}</span>
              <span className="text-slate-400">${(it.price * it.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5 text-xs font-bold text-slate-200">
          <span>Total Paid</span>
          <span className="text-emerald-400">${activeOrder.total?.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default ActiveOrderTracker;
