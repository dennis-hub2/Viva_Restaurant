import React from "react";

export default function KdsReceiptsLog({
  orders,
  completedList,
  searchQuery,
  setSelectedOrder,
}) {
  return (
    <div className="flex-1 p-10 bg-white border-4 border-gray-200 rounded-[48px] m-8 overflow-y-auto custom-scrollbar shadow-2xl min-h-0">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="grid grid-cols-5 px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] border-b-2 border-gray-100">
          <span>Reference</span>
          <span>Timestamp</span>
          <span>Type</span>
          <span>Primary Items</span>
          <span className="text-right">Live Status</span>
        </div>
        {[...orders, ...completedList]
          .filter((o) => o.id.includes(searchQuery))
          .slice(0, 50)
          .map((o) => (
            <div
              key={o.id}
              onClick={() => setSelectedOrder(o)}
              className="grid grid-cols-5 px-8 py-6 bg-white border-2 border-gray-100 rounded-4xl items-center cursor-pointer hover:border-gray-900 transition-all shadow-sm group"
            >
              <span className="text-sm font-black text-gray-900 italic">
                #{o.id.slice(-4).toUpperCase()}
              </span>
              <span className="text-xs text-gray-500 font-bold">
                {o.displayTime ||
                  o.time?.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }) ||
                  "RECENT"}
              </span>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {o.type || "ORDER"}
              </span>
              <span className="text-xs text-gray-700 font-bold truncate pr-6">
                {o.items?.[0]?.name || "..."}
              </span>
              <div className="text-right">
                <span
                  className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                    o.status === "completed"
                      ? "bg-gray-100 text-gray-900"
                      : o.status === "progress"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {o.status?.toUpperCase() || "SERVED"}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
