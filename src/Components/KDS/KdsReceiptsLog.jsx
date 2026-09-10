import React from "react";

export default function KdsReceiptsLog({
  orders,
  completedList,
  searchQuery,
  setSelectedOrder,
}) {
  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 bg-white border-2 sm:border-4 border-gray-200 rounded-3xl sm:rounded-[36px] m-3 sm:m-6 overflow-y-auto custom-scrollbar shadow-xl min-h-0 select-none">
      <div className="max-w-5xl mx-auto space-y-3">
        <div className="hidden sm:grid sm:grid-cols-5 px-6 py-3 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] border-b-2 border-gray-100">
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
              className="flex flex-col sm:grid sm:grid-cols-5 gap-2 sm:gap-0 px-4 sm:px-6 py-4 bg-white border-2 border-gray-100 rounded-2xl sm:rounded-3xl items-start sm:items-center cursor-pointer hover:border-gray-900 transition-all shadow-xs group"
            >
              <div className="flex justify-between w-full sm:w-auto items-center">
                <span className="text-sm font-black text-gray-900 italic">
                  #{o.id.slice(-4).toUpperCase()}
                </span>
                <span className="sm:hidden text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-gray-100 text-gray-800">
                  {o.status?.toUpperCase() || "SERVED"}
                </span>
              </div>
              <span className="text-xs text-gray-500 font-bold">
                {o.displayTime ||
                  o.time?.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }) ||
                  "RECENT"}
              </span>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                {o.type || "ORDER"}
              </span>
              <span className="text-xs text-gray-800 font-extrabold truncate pr-4">
                {o.items?.[0]?.name || "..."}
                {o.items?.length > 1 && ` (+${o.items.length - 1} more)`}
              </span>
              <div className="hidden sm:block text-right">
                <span
                  className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                    o.status === "completed"
                      ? "bg-gray-100 text-gray-900"
                      : o.status === "progress"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-emerald-50 text-emerald-700"
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
