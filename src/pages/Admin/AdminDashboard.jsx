import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase";

// Importing all your exact tab files!
import Overview from "./tabs/Overview";
import MenuManagement from "./tabs/MenuManagement";
import Inventory from "./tabs/Inventory";
import SalesAnalysis from "./tabs/SalesAnalysis";
import Staff from "./tabs/Staff";
import Robots from "./tabs/Robots";
import OrderHistory from "./tabs/OrderHistory";

export default function AdminDashboard() {
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  // 1. UPDATED: Lazy initialization checks localStorage first
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem("adminActiveTab");
    return savedTab ? savedTab : "Overview";
  });

  // 2. NEW: Save the active tab to localStorage every time it changes
  useEffect(() => {
    localStorage.setItem("adminActiveTab", activeTab);
  }, [activeTab]);

  // Global listener for out of stock items
  useEffect(() => {
    const menuRef = collection(db, "menuItems");
    const q = query(menuRef, where("stock", "<", 1));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lowStock = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOutOfStockItems(lowStock);
    });

    return () => unsubscribe();
  }, []);

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
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 text-gray-900 font-sans overflow-hidden relative">
      {/* PERSISTENT GLOBAL TOAST NOTIFICATION */}
      {outOfStockItems.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[100] animate-in fade-in slide-in-from-right-10">
          <div className="bg-red-600 text-white px-6 py-4 rounded-2xl shadow-[0_10px_40px_rgba(220,38,38,0.5)] border-4 border-white flex flex-col gap-2 min-w-[320px]">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl animate-pulse">
                <span className="text-xl">⚠️</span>
              </div>
              <div>
                <p className="font-black text-xs uppercase tracking-widest leading-none mb-1">Stock Alert</p>
                <p className="text-[10px] font-bold opacity-90">{outOfStockItems.length} items are currently unavailable</p>
              </div>
            </div>
            
            <div className="max-h-[150px] overflow-y-auto custom-scrollbar bg-black/20 rounded-xl p-3 mt-1 space-y-2">
              {outOfStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-tight truncate pr-2">{item.name}</span>
                  <span className="bg-red-500 text-[9px] font-black px-2 py-0.5 rounded border border-white/20 shrink-0">OUT OF STOCK</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setActiveTab("Inventory")}
              className="mt-2 w-full bg-white text-red-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-colors shadow-lg"
            >
              Go to Inventory
            </button>
          </div>
        </div>
      )}

      {/* Mobile Header with Tab Selector */}
      <div className="md:hidden bg-white border-b-4 border-gray-200 p-4 flex justify-between items-center shadow-lg z-20">
        <h1 className="text-xl font-black tracking-tighter italic text-gray-900 uppercase">Viva Admin</h1>
        <select 
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border-none outline-none ring-4 ring-gray-100 shadow-md"
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
