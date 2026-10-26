/**
 * @file Sidebar.jsx
 * @description Administration Navigation Sidebar and Session Termination Controller.
 * 
 * Thesis Context:
 * Main navigation rail for the administrator dashboard, providing switches across
 * operations, menu, stock, sales, personnel, robotics, and order history, with session logout.
 * 
 * @module pages/Admin/components/Sidebar
 * @author Thesis Research Team
 */

import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../../firebase";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("viva_admin_session");
    navigate("/admin/login");
  };

  const navItems = [
    { name: "Overview", icon: "📊" },
    { name: "Menu Management", icon: "🍽️" },
    { name: "Inventory", icon: "📦" },
    { name: "Sales Analysis", icon: "📈" },
    { name: "Staff", icon: "👥" },
    { name: "Robots", icon: "🤖" },
    { name: "Order History", icon: "🕒" },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container (Desktop Persistent + Mobile Drawer) */}
      <aside
        className={`w-72 shrink-0 bg-white border-r-4 border-gray-200 shadow-2xl z-50 flex flex-col py-8 transition-transform duration-300 ${
          isOpen
            ? "fixed inset-y-0 left-0 translate-x-0"
            : "hidden md:flex relative translate-x-0"
        }`}
      >
        <div className="px-8 flex items-center justify-between mb-10">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black tracking-tighter text-gray-900 leading-none italic uppercase">
              ADMIN
            </h1>
            <div className="h-1.5 w-12 bg-red-600 rounded-full"></div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
              Command Center
            </p>
          </div>

          {isOpen && (
            <button
              onClick={onClose}
              className="md:hidden p-2 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200"
            >
              ✕
            </button>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setActiveTab(item.name);
                if (onClose) onClose();
              }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.15em] transition-all transform active:scale-95 ${
                activeTab === item.name
                  ? "bg-gray-900 text-white shadow-lg"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="px-4 mt-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-red-600 border-4 border-red-50 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-xs"
          >
            <span>🚪</span>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
