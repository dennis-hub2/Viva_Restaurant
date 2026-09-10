import React from "react";
import { LayoutDashboard, Clock, CheckCircle2, FileText } from "lucide-react";

export default function KdsSidebar({ activeNav, setActiveTab, isOpen, setIsOpen }) {
  const items = [
    {
      id: "ORDERS",
      icon: <LayoutDashboard size={20} className="sm:w-6 sm:h-6" />,
      label: "Queue",
    },
    {
      id: "PREP",
      icon: <Clock size={20} className="sm:w-6 sm:h-6" />,
      label: "Cooking",
    },
    {
      id: "HISTORY",
      icon: <CheckCircle2 size={20} className="sm:w-6 sm:h-6" />,
      label: "Archive",
    },
    {
      id: "RECEIPTS",
      icon: <FileText size={20} className="sm:w-6 sm:h-6" />,
      label: "Logs",
    },
  ];

  return (
    <>
      {/* Desktop / Tablet Sidebar */}
      <div className="hidden md:flex w-20 sm:w-24 md:w-28 lg:w-32 bg-white border-r-2 sm:border-r-4 border-gray-200 flex-col py-4 sm:py-6 shrink-0 gap-2 sm:gap-3 overflow-y-auto custom-scrollbar select-none">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center gap-1.5 sm:gap-2 py-4 sm:py-5 mx-2 sm:mx-3 rounded-2xl sm:rounded-3xl cursor-pointer transition-all border-2 ${
              activeNav === item.id
                ? "text-white bg-gray-900 border-gray-900 shadow-lg scale-[1.02]"
                : "text-gray-400 border-transparent hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            {item.icon}
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Mobile Top Nav Bar (When on small screens < md) */}
      <div className="md:hidden flex bg-white border-b-2 border-gray-200 px-2 py-2 gap-1 justify-around shrink-0 select-none">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
              activeNav === item.id
                ? "bg-gray-900 text-white border-gray-900 shadow-xs"
                : "bg-gray-50 text-gray-500 border-gray-200"
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-black">{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
