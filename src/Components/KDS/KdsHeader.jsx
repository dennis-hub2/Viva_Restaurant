import React from "react";
import { Settings, Menu, Server, ShieldCheck, ShieldAlert } from "lucide-react";

export default function KdsHeader({
  currentTime,
  dispatchEnabled,
  dispatchStatus,
  onToggleSidebar,
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 md:px-8 py-3 sm:py-4 border-b-2 sm:border-b-4 border-gray-200 bg-white shrink-0 shadow-xs z-20">
      {/* Brand & Mobile Menu */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 transition"
            title="Toggle Navigation"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="text-xs sm:text-sm font-black tracking-[0.2em] sm:tracking-[0.3em] text-gray-900 flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-900 rounded-xl flex items-center justify-center text-base sm:text-lg text-white shadow-md italic font-black">
            V
          </div>
          <span className="hidden sm:inline">KDS TERMINAL</span>
        </div>
      </div>

      {/* Clock */}
      <div className="font-mono text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tighter tabular-nums flex items-center gap-2 sm:gap-4">
        <span className="text-gray-300 font-light">/</span>
        {currentTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })}
      </div>

      {/* Status Badges */}
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
        <div
          className={`text-[9px] sm:text-[10px] font-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border uppercase tracking-wider shadow-2xs flex items-center gap-1.5 ${
            dispatchEnabled
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-amber-50 border-amber-200 text-amber-700"
          }`}
        >
          {dispatchEnabled ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
          <span className="hidden md:inline">
            {dispatchEnabled ? "Backend Dispatch Live" : "Manual Mode"}
          </span>
          <span className="md:hidden">{dispatchEnabled ? "Live" : "Manual"}</span>
        </div>

        <div className="hidden lg:flex text-[9px] sm:text-[10px] font-black px-3.5 py-2 rounded-xl border uppercase tracking-wider bg-gray-50 border-gray-200 text-gray-700 items-center gap-1.5">
          <Server size={12} />
          {dispatchStatus.listenersActive ? "Listener Active" : "Listener Idle"}
        </div>

        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] sm:text-[10px] font-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-center gap-2 shadow-2xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="hidden sm:inline">SYSTEM ONLINE</span>
        </div>

        <button className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition border border-gray-200 shadow-2xs">
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
