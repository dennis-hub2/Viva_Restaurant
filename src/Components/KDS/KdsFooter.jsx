import React from "react";
import { Search, Cpu } from "lucide-react";

export default function KdsFooter({
  searchQuery,
  setSearchQuery,
  pendingCount,
  preppingCount,
}) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 md:px-8 py-3 border-t-2 sm:border-t-4 border-gray-200 bg-white shrink-0 shadow-inner z-10 select-none">
      {/* Search Input */}
      <div className="flex items-center gap-3 bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-2 group focus-within:border-gray-900 transition-all shadow-inner w-full sm:w-auto">
        <Search
          size={16}
          className="text-gray-400 group-focus-within:text-gray-900 shrink-0"
        />
        <input
          placeholder="SEARCH TICKET ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none outline-none text-[11px] text-gray-900 font-black tracking-wider w-full sm:w-36 placeholder:text-gray-300 uppercase"
        />
      </div>

      {/* Summary Statistics */}
      <div className="flex items-center gap-6 sm:gap-10 md:gap-12">
        <StatItem label="PENDING" value={pendingCount} color="text-emerald-700" />
        <StatItem label="PREPPING" value={preppingCount} color="text-blue-700" />
      </div>

      {/* System Status Indicator */}
      <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
        <Cpu size={14} className="text-gray-500" />
        <span>HARDWARE READY</span>
      </div>
    </footer>
  );
}

function StatItem({ label, value, color }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[9px] font-black tracking-widest text-gray-500 mb-0.5">
        {label}
      </span>
      <span
        className={`font-mono text-base sm:text-lg font-black leading-none tabular-nums ${color}`}
      >
        {value}
      </span>
    </div>
  );
}
