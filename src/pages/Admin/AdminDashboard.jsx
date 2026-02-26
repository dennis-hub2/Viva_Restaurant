import React, { useState } from "react";
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
  // Let's default to Overview
  const [activeTab, setActiveTab] = useState("Overview");

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
    <div className="flex h-screen bg-[#333338] text-white font-sans overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-10 max-w-7xl mx-auto w-full">{renderContent()}</div>
      </main>
    </div>
  );
}
