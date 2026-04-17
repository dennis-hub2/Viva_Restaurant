import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";

// Importing all your exact tab files!
import Overview from "./tabs/Overview";
import MenuManagement from "./tabs/MenuManagement";
import Inventory from "./tabs/Inventory";
import SalesAnalysis from "./tabs/SalesAnalysis";
import Staff from "./tabs/Staff";
import Robots from "./tabs/Robots";
import OrderHistory from "./tabs/OrderHistory";

export default function AdminDashboard() {
  // 1. UPDATED: Lazy initialization checks localStorage first
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem("adminActiveTab");
    return savedTab ? savedTab : "Overview";
  });

  // 2. NEW: Save the active tab to localStorage every time it changes
  useEffect(() => {
    localStorage.setItem("adminActiveTab", activeTab);
  }, [activeTab]);

  // This maps the Sidebar button clicks to your actual files
  const renderContent = () => {
    switch (activeTab) {
      case "Overview":
        return <Overview />;
      case "Menu Management":
        return <MenuManagement />;
      case "Inventory":
        return <Inventory />;
      case "Sales Analysis":
        return <SalesAnalysis />;
      case "Staff":
        return <Staff />;
      case "Robots":
        return <Robots />;
      case "Order History":
        return <OrderHistory />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#333338] text-white font-sans overflow-hidden">
      {/* Mobile Header with Tab Selector */}
      <div className="md:hidden bg-[#2C0E4F] p-4 flex justify-between items-center shadow-lg z-20">
        <h1 className="text-xl font-bold">Admin</h1>
        <select 
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          className="bg-[#4B1E83] text-white px-3 py-2 rounded-lg text-sm border-none outline-none ring-1 ring-white/20"
        >
          <option value="Overview">Overview</option>
          <option value="Menu Management">Menu Management</option>
          <option value="Inventory">Inventory</option>
          <option value="Sales Analysis">Sales Analysis</option>
          <option value="Staff">Staff</option>
          <option value="Robots">Robots</option>
          <option value="Order History">Order History</option>
        </select>
      </div>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">{renderContent()}</div>
      </main>
    </div>
  );
}
