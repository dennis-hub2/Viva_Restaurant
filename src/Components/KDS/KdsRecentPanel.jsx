import React from "react";
import { History, ChevronRight } from "lucide-react";

export default function KdsRecentPanel({
  completedList,
  setSelectedOrder,
  setShowAllHistory,
}) {
  return (
    <div className="hidden xl:flex w-52 2xl:w-60 bg-white border-l-2 sm:border-l-4 border-gray-200 flex-col shrink-0 overflow-hidden shadow-xs select-none">
      <div className="flex items-center justify-between p-4 sm:p-6 border-b-2 border-gray-100">
        <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase flex items-center gap-1.5">
          <History size={14} /> Latest Activity
        </span>
        <span className="bg-gray-900 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
          {completedList.length}
        </span>
      </div>
      <div className="flex-1 space-y-2.5 overflow-y-auto custom-scrollbar p-4 sm:p-5">
        {completedList.slice(0, 15).map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedOrder(item)}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border-2 border-gray-100 cursor-pointer hover:border-gray-900 transition-all shadow-xs group"
          >
            <span className="font-mono text-xs font-black text-gray-600 group-hover:text-gray-900 italic">
              #{item.id.slice(-4).toUpperCase()}
            </span>
            <span className="text-[9px] text-gray-400 font-black uppercase tracking-tight">
              {item.displayTime}
            </span>
          </div>
        ))}
        {completedList.length === 0 && (
          <div className="p-6 text-center text-xs font-bold text-gray-400 italic">
            No completed history yet
          </div>
        )}
      </div>
      <button
        onClick={() => setShowAllHistory(true)}
        className="m-4 p-4 bg-gray-50 hover:bg-gray-900 border-2 border-gray-200 hover:border-gray-900 text-gray-900 hover:text-white rounded-2xl text-[10px] tracking-[0.2em] font-black uppercase transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
      >
        <span>Full Archive</span>
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
