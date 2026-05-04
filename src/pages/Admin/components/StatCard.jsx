import React from "react";

const StatCard = ({ icon, title, value, growth, valueColor }) => (
  <div className="bg-white rounded-3xl p-8 border-4 border-gray-200 shadow-xl flex flex-col justify-between h-48 relative overflow-hidden group hover:border-gray-900 transition-all transform active:scale-[0.98]">
    <div className="flex justify-between items-start">
      <span className="text-3xl bg-gray-100 p-3 rounded-2xl border-2 border-gray-200 text-gray-900 group-hover:bg-gray-900 group-hover:text-white transition-colors">
        {icon}
      </span>
      <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black border-2 border-emerald-100 uppercase tracking-widest shadow-sm">
        {growth}
      </span>
    </div>
    <div>
      <h3 className={`text-4xl font-black mt-4 mb-1 tracking-tighter ${valueColor}`}>{value}</h3>
      <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
        {title}
      </p>
    </div>
  </div>
);

export default StatCard;
