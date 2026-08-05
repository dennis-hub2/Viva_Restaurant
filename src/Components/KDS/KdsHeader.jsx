import React from "react";
import { Settings } from "lucide-react";

export default function KdsHeader({
  currentTime,
  dispatchEnabled,
  dispatchStatus,
}) {
  return (
    <div className="flex items-center justify-between px-10 py-6 border-b-4 border-gray-200 bg-white shrink-0 shadow-sm z-10">
      <div className="text-[12px] font-black tracking-[0.4em] text-gray-900 flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center text-lg text-white shadow-xl italic font-black">
          V
        </div>
        <span>KDS TERMINAL</span>
      </div>
      <div className="font-mono text-3xl font-black text-gray-900 tracking-tighter tabular-nums flex items-center gap-6">
        <span className="text-gray-200">/</span>
        {currentTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })}
      </div>
      <div className="flex items-center gap-6">
        <div
          className={`text-[10px] font-black px-5 py-2.5 rounded-2xl border-2 uppercase tracking-widest shadow-sm ${
            dispatchEnabled
              ? "bg-blue-50 border-blue-100 text-blue-600"
              : "bg-amber-50 border-amber-100 text-amber-600"
          }`}
        >
          {dispatchEnabled ? "Backend Dispatch Live" : "Backend Dispatch Off"}
        </div>
        <div className="text-[10px] font-black px-5 py-2.5 rounded-2xl border-2 uppercase tracking-widest shadow-sm bg-gray-50 border-gray-200 text-gray-600">
          {dispatchStatus.listenersActive
            ? "Listener Healthy"
            : "Listener Offline"}
        </div>
        <div className="bg-emerald-50 border-2 border-emerald-100 text-emerald-600 text-[10px] font-black px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
          SYSTEM ONLINE
        </div>
        <button className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-all border-2 border-gray-200 shadow-sm">
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
}
