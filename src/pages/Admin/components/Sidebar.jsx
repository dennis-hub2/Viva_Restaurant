import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../../firebase";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/admin/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
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
    // 1. UPDATED: The gradient colors are now exactly what you requested!
    <aside className="w-64 flex-shrink-0 bg-gradient-to-b from-[#2C0E4F] to-[#4B1E83] flex flex-col hidden md:flex border-r border-white/5 shadow-2xl z-10 py-6">
      <div className="px-6 flex items-center gap-3 mb-10">
        <div className="w-8 h-8 bg-white text-[#2C0E4F] rounded-full flex items-center justify-center font-black text-xl">
          ≡
        </div>
        <h1 className="text-xl font-bold tracking-wide text-white">
          Admin Page
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setActiveTab(item.name)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === item.name
                ? "bg-[#5b2f8c] text-white border-l-4 border-white shadow-lg"
                : "text-gray-300 hover:bg-white/5 hover:text-white border-l-4 border-transparent"
            }`}
          >
            <span className="text-lg opacity-80">{item.icon}</span>
            {item.name}
          </button>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="px-4 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-bold text-red-300 hover:bg-red-500/10 transition-all border border-transparent"
        >
          <span className="text-lg">🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
