import React, { useState, useEffect } from "react";
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";

// Import your newly extracted components
import StatCounter from "./components/StatCounter";
import OrderColumn from "./components/OrderColumn";
import OrderCard from "./components/OrderCard";

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [time, setTime] = useState("");

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

  // 2. Live digital clock
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
      <header className="flex justify-between items-center px-6 py-4 border-b border-gray-800 bg-[#141414]">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 text-black font-black px-2 py-1 rounded text-sm">
            KDS
          </div>
          <h1 className="text-gray-400 text-sm font-medium uppercase tracking-wider">
            Kitchen Display System
          </h1>
        </div>
        <div className="text-3xl font-mono text-orange-500 tracking-widest font-light">
          {time || "00:00:00"}
        </div>
        <div className="flex gap-6">
          {columnConfig.map((col) => (
            <StatCounter
              key={col.id}
              label={col.title}
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
                <button
                  onClick={() => updateOrderStatus(order.id, col.nextStatus)}
                  className={`w-full mt-4 py-3 rounded ${col.colorData.buttonBg} ${col.colorData.text} border ${col.colorData.buttonBorder} ${col.colorData.buttonHover} transition-colors font-medium text-sm`}
                >
                  {col.actionText}
                </button>
              </OrderCard>
            ))}
          </OrderColumn>
        ))}
      </div>
    </div>
  );
}
