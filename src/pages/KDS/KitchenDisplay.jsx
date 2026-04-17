import React, { useState, useEffect } from "react";
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { ref, onValue, update } from "firebase/database";
import { db, rtdb } from "../../firebase";

// Import your newly extracted components
import StatCounter from "./components/StatCounter";
import OrderColumn from "./components/OrderColumn";
import OrderCard from "./components/OrderCard";

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [robots, setRobots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [time, setTime] = useState("");
  const [selectedRobotId, setSelectedRobotId] = useState("");
  const [isDispatching, setIsDispatching] = useState(null); // stores orderId being dispatched

  // 1. Live listener for Firestore orders
  useEffect(() => {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(liveOrders);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Live listener for RTDB robots
  useEffect(() => {
    const robotsRef = ref(rtdb, "robots");
    const unsubscribe = onValue(robotsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const fleetData = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setRobots(fleetData);
      } else {
        setRobots([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // 3. Live digital clock
  useEffect(() => {
    const timer = setInterval(
      () => setTime(new Date().toLocaleTimeString("en-US", { hour12: false })),
      1000,
    );
    return () => clearInterval(timer);
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const dispatchRobot = async (order, robotId) => {
    if (!robotId) return;
    
    try {
      // 1. Update Robot in RTDB
      const robotRef = ref(rtdb, `robots/${robotId}`);
      await update(robotRef, {
        status: "delivering",
        currentTask: `Table ${order.table}`,
        destination: order.table,
        command: "GO_TO_TABLE",
        lastOrderId: order.id
      });

      // 2. Update Order in Firestore
      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, { 
        status: "dispatched",
        dispatchedAt: new Date().toISOString(),
        assignedRobotId: robotId
      });

      setIsDispatching(null);
      setSelectedRobotId("");
    } catch (error) {
      console.error("Error dispatching robot:", error);
    }
  };

  const columnConfig = [
    {
      id: "new",
      title: "New Orders",
      orders: orders.filter((o) => o.status === "new"),
      colorData: {
        text: "text-yellow-500",
        bg: "bg-yellow-500",
        border: "border-yellow-500/20",
        buttonBg: "bg-yellow-500/10",
        buttonBorder: "border-yellow-500/30",
        buttonHover: "hover:bg-yellow-500/20",
      },
      actionText: "→ Start Cooking",
      nextStatus: "progress",
    },
    {
      id: "progress",
      title: "In Progress",
      orders: orders.filter((o) => o.status === "progress"),
      colorData: {
        text: "text-blue-500",
        bg: "bg-blue-500",
        border: "border-blue-500/20",
        buttonBg: "bg-blue-500/10",
        buttonBorder: "border-blue-500/30",
        buttonHover: "hover:bg-blue-500/20",
      },
      actionText: "→ Mark Ready",
      nextStatus: "ready",
    },
    {
      id: "ready",
      title: "Ready",
      orders: orders.filter((o) => o.status === "ready"),
      colorData: {
        text: "text-green-500",
        bg: "bg-green-500",
        border: "border-green-500/20",
        buttonBg: "bg-green-500/10",
        buttonBorder: "border-green-500/30",
        buttonHover: "hover:bg-green-500/20",
      },
      actionText: "✓ Mark Delivered",
      nextStatus: "delivered",
    },
  ];

  if (isLoading) {
    return (
      <div className="h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="text-orange-500 font-bold animate-pulse text-2xl tracking-widest uppercase">
          Kitchen Syncing...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0F0F0F] text-white flex flex-col font-sans overflow-hidden">
      <header className="flex flex-col md:flex-row justify-between items-center px-4 md:px-6 py-4 border-b border-gray-800 bg-[#141414] gap-4 md:gap-0">
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-orange-500 text-black font-black px-2 py-1 rounded text-xs md:text-sm">
              KDS
            </div>
            <h1 className="text-gray-400 text-[10px] md:text-sm font-medium uppercase tracking-wider whitespace-nowrap">
              Kitchen Display <span className="hidden sm:inline">System</span>
            </h1>
          </div>
          {/* Mobile Clock: only shows when flex-col triggers */}
          <div className="md:hidden text-xl font-mono text-orange-500 tracking-widest font-light">
            {time || "00:00:00"}
          </div>
        </div>

        {/* Desktop Clock: hidden on mobile */}
        <div className="hidden md:block text-3xl font-mono text-orange-500 tracking-widest font-light">
          {time || "00:00:00"}
        </div>

        <div className="flex justify-between w-full md:w-auto gap-4 md:gap-6 border-t md:border-t-0 border-gray-800 pt-3 md:pt-0">
          {columnConfig.map((col) => (
            <StatCounter
              key={col.id}
              label={col.title.split(' ')[0]} // Show only first word on small screens
              count={col.orders.length}
              color={col.colorData.bg}
            />
          ))}
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 p-6 overflow-hidden">
        {columnConfig.map((col) => (
          <OrderColumn
            key={col.id}
            title={col.title}
            count={col.orders.length}
            colorData={col.colorData}
          >
            {col.orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                accent={col.colorData.text}
              >
                {col.id === "ready" ? (
                  <div className="space-y-2 mt-4">
                    {isDispatching === order.id ? (
                      <div className="bg-[#111] p-3 rounded-lg border border-white/10 animate-in fade-in slide-in-from-top-2">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Select Available Robot</p>
                        <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                          {robots.filter(r => r.status === 'docked' || r.status === 'idle').length > 0 ? (
                            robots.filter(r => r.status === 'docked' || r.status === 'idle').map(robot => (
                              <button
                                key={robot.id}
                                onClick={() => dispatchRobot(order, robot.id)}
                                className="w-full text-left px-3 py-2 rounded bg-white/5 hover:bg-blue-500/20 border border-white/5 hover:border-blue-500/30 transition-all group flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-gray-200">🤖 {robot.name}</span>
                                  <span className="text-[9px] text-gray-500 font-black uppercase">{robot.battery}%</span>
                                </div>
                                <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">Dispatch →</span>
                              </button>
                            ))
                          ) : (
                            <p className="text-[10px] text-red-400 font-bold py-2 italic text-center">No robots available</p>
                          )}
                        </div>
                        <button 
                          onClick={() => setIsDispatching(null)}
                          className="w-full mt-2 py-1 text-[10px] font-black text-gray-500 uppercase hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setIsDispatching(order.id)}
                          className="w-full py-3 rounded bg-blue-500/10 text-blue-500 border border-blue-500/30 hover:bg-blue-500/20 transition-all font-bold text-sm flex items-center justify-center gap-2 group"
                        >
                          <span>🚀</span> Dispatch Robot
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, col.nextStatus)}
                          className={`w-full py-2 rounded ${col.colorData.buttonBg} ${col.colorData.text} border ${col.colorData.buttonBorder} ${col.colorData.buttonHover} transition-colors font-medium text-[11px] uppercase tracking-wider`}
                        >
                          Manual Delivery
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => updateOrderStatus(order.id, col.nextStatus)}
                    className={`w-full mt-4 py-3 rounded ${col.colorData.buttonBg} ${col.colorData.text} border ${col.colorData.buttonBorder} ${col.colorData.buttonHover} transition-colors font-medium text-sm`}
                  >
                    {col.actionText}
                  </button>
                )}
              </OrderCard>
            ))}
          </OrderColumn>
        ))}
      </div>
    </div>
  );
}
