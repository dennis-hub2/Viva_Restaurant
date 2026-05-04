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
    <aside className="w-72 flex-shrink-0 bg-white flex flex-col hidden md:flex border-r-4 border-gray-200 shadow-2xl z-10 py-8">
      <div className="px-8 flex flex-col gap-1 mb-12">
        <h1 className="text-3xl font-black tracking-tighter text-gray-900 leading-none">
          VIVA ADMIN
        </h1>
        <div className="h-1.5 w-12 bg-red-600 rounded-full"></div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Command Center</p>
      </div>

      <nav className="flex-1 px-4 space-y-3">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setActiveTab(item.name)}
            className={`w-full flex items-center gap-5 px-6 py-5 rounded-2xl text-xs font-black uppercase tracking-[0.15em] transition-all transform active:scale-95 ${
              activeTab === item.name
                ? "bg-gray-900 text-white shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <span className="text-2xl grayscale-0">{item.icon}</span>
            {item.name}
          </button>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="px-4 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-red-600 border-4 border-red-50 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm"
        >
          <span>🚪</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
