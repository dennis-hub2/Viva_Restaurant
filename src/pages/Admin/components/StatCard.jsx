import React from "react";

const StatCard = ({ icon, title, value, growth, valueColor }) => (
  <div className="bg-[#2A2A2D] rounded-2xl p-6 border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] flex flex-col justify-between h-40 relative overflow-hidden group hover:border-white/10 transition-colors">
    <div className="flex justify-between items-start">
      <span className="text-2xl bg-[#1A1A1D] p-2 rounded-xl border border-white/5 text-white">
        {icon}
      </span>
      <span className="bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full text-xs font-bold border border-green-500/20">
        {growth}
      </span>
    </div>
    <div>
      <h3 className={`text-3xl font-black mt-4 mb-1 ${valueColor}`}>{value}</h3>
      <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">
        {title}
      </p>
    </div>
    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
  </div>
);

export default StatCard;
