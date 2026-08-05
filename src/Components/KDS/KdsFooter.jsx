import React from "react";
import { Search } from "lucide-react";

export default function KdsFooter({
  searchQuery,
  setSearchQuery,
  pendingCount,
  preppingCount,
}) {
  return (
    <div className="flex items-center gap-12 px-10 py-4 border-t-4 border-gray-200 bg-white shrink-0 shadow-inner">
      <div className="flex items-center gap-4 bg-gray-50 border-2 border-gray-100 rounded-3xl px-6 py-3 group focus-within:border-gray-900 transition-all shadow-inner">
        <Search
          size={18}
          className="text-gray-400 group-focus-within:text-gray-900"
        />
        <input
          placeholder="ORDER ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none outline-none text-[11px] text-gray-900 font-black tracking-widest w-40 placeholder:text-gray-300 uppercase"
        />
      </div>
      <div className="flex gap-16">
        <StatItem label="PENDING" value={pendingCount} color="text-emerald-600" />
        <StatItem label="PREPPING" value={preppingCount} color="text-blue-600" />
        <StatItem label="AVG TIME" value="12:45" color="text-gray-900" />
      </div>
      <div className="ml-auto flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse"></div>
        HARDWARE READY
      </div>
    </div>
  );
}

function StatItem({ label, value, color }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[8px] font-black tracking-[0.2em] text-[#444] mb-0.5">
        {label}
      </span>
      <span
        className={`font-mono text-lg font-black leading-none tabular-nums ${color}`}
      >
        {value}
      </span>
    </div>
  );
}
