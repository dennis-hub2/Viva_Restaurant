import React from "react";

export default function KdsRecentPanel({
  completedList,
  setSelectedOrder,
  setShowAllHistory,
}) {
  return (
    <div className="w-60 bg-white border-l-4 border-gray-200 flex flex-col shrink-0 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-8 border-b-2 border-gray-100">
        <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
          Latest Activity
        </span>
        <span className="bg-gray-900 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">
          {completedList.length}
        </span>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar p-6">
        {completedList.slice(0, 15).map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedOrder(item)}
            className="flex items-center justify-between p-5 rounded-3xl bg-gray-50 border-2 border-gray-100 animate-in slide-in-from-right-4 cursor-pointer hover:border-gray-900 transition-all shadow-sm group"
          >
            <span className="font-mono text-sm font-black text-gray-500 group-hover:text-gray-900 italic">
              #{item.id.slice(-4).toUpperCase()}
            </span>
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-tight">
              {item.displayTime}
            </span>
          </div>
        ))}
      </div>
      <button
        onClick={() => setShowAllHistory(true)}
        className="m-6 p-5 bg-white border-2 border-gray-200 text-gray-900 rounded-3xl text-[10px] tracking-[0.2em] font-black uppercase hover:bg-gray-900 hover:text-white transition-all shadow-lg active:scale-95"
      >
        VIEW HISTORY
      </button>
    </div>
  );
}
