import React from "react";
import { LayoutDashboard, Clock, CheckCircle2, FileText } from "lucide-react";

export default function KdsSidebar({ activeNav, setActiveTab }) {
  const items = [
    {
      id: "ORDERS",
      icon: <LayoutDashboard size={24} />,
      label: "Queue",
    },
    { id: "PREP", icon: <Clock size={24} />, label: "Cooking" },
    {
      id: "HISTORY",
      icon: <CheckCircle2 size={24} />,
      label: "Archive",
    },
    { id: "RECEIPTS", icon: <FileText size={24} />, label: "Logs" },
  ];

  return (
    <div className="w-35 bg-white border-r-4 border-gray-200 flex flex-col py-8 shrink-0 gap-3 overflow-y-auto custom-scrollbar">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`flex flex-col items-center gap-2.5 py-6 mx-4 rounded-[28px] cursor-pointer transition-all border-2 ${
            activeNav === item.id
              ? "text-white bg-gray-900 border-gray-900 shadow-xl"
              : "text-gray-400 border-transparent hover:text-gray-900 hover:bg-gray-50 hover:border-gray-100"
          }`}
        >
          {item.icon}
          <span className="text-[10px] font-black uppercase tracking-widest">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
