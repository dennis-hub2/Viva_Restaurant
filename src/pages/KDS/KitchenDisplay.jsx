import React, { useState, useEffect } from "react";

// Import your newly extracted components
import StatCounter from "./components/StatCounter";
import OrderColumn from "./components/OrderColumn";
import OrderCard from "./components/OrderCard";

// Mock Data
const initialOrders = [
  {
    id: "4825",
    table: 3,
    status: "new",
    timeElapsed: "2m",
    items: [
      { qty: 2, name: "Wagyu Burger", note: "Medium rare" },
      { qty: 1, name: "Miso Ramen", note: "Extra chashu" },
    ],
  },
  {
    id: "4824",
    table: 7,
    status: "progress",
    timeElapsed: "8m",
    items: [
      { qty: 2, name: "Truffle Pasta" },
      { qty: 1, name: "Tuna Tartare" },
    ],
  },
  {
    id: "4823",
    table: 1,
    status: "progress",
    timeElapsed: "12m",
    items: [
      { qty: 3, name: "Dragon Roll" },
      { qty: 2, name: "Lobster Bisque" },
    ],
  },
  {
    id: "4822",
    table: 4,
    status: "ready",
    timeElapsed: "18m",
    isLate: true,
    items: [
      { qty: 1, name: "Crispy Duck" },
      { qty: 2, name: "Matcha Lava Cake" },
    ],
  },
];

export default function KitchenDisplay() {
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem("kds_orders");
    return saved ? JSON.parse(saved) : initialOrders;
  });
  const [time, setTime] = useState("");

  // 1. Sync local state out to localStorage
  useEffect(() => {
    localStorage.setItem("kds_orders", JSON.stringify(orders));
  }, [orders]);

  // 2. Live digital clock
  useEffect(() => {
    const timer = setInterval(
      () => setTime(new Date().toLocaleTimeString("en-US", { hour12: false })),
      1000,
    );
    return () => clearInterval(timer);
  }, []);

  // 3. NEW: Listen for changes coming in from the Customer Page!
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Only react if the specific 'kds_orders' key was modified
      if (e.key === "kds_orders") {
        if (e.newValue) {
          setOrders(JSON.parse(e.newValue));
        } else {
          setOrders([]); // Clear board if data is deleted
        }
      }
    };

    // Tell the browser window to listen for storage events
    window.addEventListener("storage", handleStorageChange);

    // Clean up the listener if we leave the KDS page
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const updateOrderStatus = (orderId, newStatus) => {
    if (newStatus === "delivered") {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
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
