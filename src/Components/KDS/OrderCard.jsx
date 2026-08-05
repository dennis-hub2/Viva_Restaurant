import React from "react";
import { Timestamp } from "firebase/firestore";
import { Clock, Maximize2 } from "lucide-react";

function OrderCard({ order, onAction, currentTime }) {
  const items = order.items || [];

  const formatElapsedTime = (start) => {
    if (!start) return "00:00";
    const startDate =
      start instanceof Timestamp ? start.toDate() : new Date(start);
    const diff = Math.floor((currentTime - startDate) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getTimeInStage = (start) => {
    if (!start) return "0m";
    const startDate =
      start instanceof Timestamp ? start.toDate() : new Date(start);
    const diff = Math.floor((currentTime - startDate) / 60000);
    return `${diff}m`;
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case "new":
        return {
          label: "NEW",
          color: "bg-emerald-50 text-emerald-600 border-2 border-emerald-100",
        };
      case "progress":
        return {
          label: "PREPPING",
          color: "bg-blue-50 text-blue-600 border-2 border-blue-100",
        };
      case "ready":
        return {
          label: "DISPATCHED",
          color: "bg-orange-50 text-orange-600 border-2 border-orange-100",
        };
      case "completed":
        return {
          label: "COMPLETED",
          color: "bg-gray-100 text-gray-900 border-2 border-gray-200",
        };
      default:
        return {
          label: "ORDER",
          color: "bg-gray-50 text-gray-400 border-2 border-gray-100",
        };
    }
  };

  const statusInfo = getStatusInfo(order.status);
  const stageStartTime = order.statusUpdatedAt || order.createdAt || order.time;

  return (
    <div
      onClick={() => onAction(order)}
      className={`group relative bg-white rounded-3xl border-4 border-gray-200 p-8 cursor-pointer transition-all hover:border-gray-900 flex flex-col justify-between shadow-xl transform active:scale-[0.98] ${order.status === "progress"
          ? "border-t-4 border-t-blue-600"
          : order.status === "ready"
            ? "border-t-4 border-t-orange-600"
            : order.type?.toLowerCase() === "dine in"
              ? "border-l-4 border-l-emerald-500"
              : "border-l-4 border-l-orange-500"
        }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="text-3xl font-black text-gray-900 tracking-tighter italic">
            #{order.id.slice(-4).toUpperCase()}
          </span>
          {order.table && (
            <span className="text-[10px] font-black text-gray-400 uppercase mt-2 tracking-widest">
              Table {order.table}
            </span>
          )}
        </div>
        <span
          className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${statusInfo.color}`}
        >
          {statusInfo.label}
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center py-6 space-y-3">
        {items.length > 0 ? (
          items.slice(0, 3).map((item, i) => (
            <div key={i} className="flex gap-4 items-center">
              <span className="text-sm font-black text-gray-900 bg-gray-100 w-8 h-8 rounded-xl flex items-center justify-center border-2 border-gray-200">
                {item.qty}x
              </span>
              <span className="text-lg font-bold text-gray-700 leading-tight truncate uppercase tracking-tight">
                {item.name}
              </span>
            </div>
          ))
        ) : (
          <p className="text-xs font-bold text-red-500/50 uppercase italic tracking-widest">
            No items found
          </p>
        )}
      </div>

      <div className="flex justify-between items-end shrink-0 pt-6 border-t-2 border-gray-100 mt-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <Clock size={14} className="text-gray-900" />
            {getTimeInStage(stageStartTime)}
          </div>
          {order.assignedRobot && (
            <div className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border-2 border-blue-100 uppercase tracking-widest w-fit shadow-sm">
              Robot: {order.assignedRobot.toUpperCase()}
            </div>
          )}
        </div>
        {order.status === "progress" && (
          <div className="text-blue-600 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.4)]"></div>
            <span className="font-black text-lg tracking-tighter tabular-nums text-gray-900">
              {formatElapsedTime(stageStartTime)}
            </span>
          </div>
        )}
      </div>

      <div className="absolute top-1/2 right-6 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center shadow-2xl">
          <Maximize2 size={24} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default OrderCard;
