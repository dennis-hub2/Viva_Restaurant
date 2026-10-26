/**
 * @file OrderCard.jsx
 * @description Kitchen Ticket Card with Elapsed Preparation Timers and Robotic Dispatch Controls.
 * 
 * Thesis Context:
 * Represents a single kitchen order in the KDS kanban board.
 * Visualizes table number, elapsed cooking time, line items, and dynamic action buttons:
 * - 'Start Prep': Transitions ticket from 'new' to 'progress'.
 * - 'Ready': Marks ticket prepared and ready for handover.
 * - 'Assign Robot': Initiates cyber-physical dispatch of SwagBot1 to the target station.
 * 
 * @module Components/KDS/OrderCard
 * @author Thesis Research Team
 */

import React from "react";
import { Timestamp } from "firebase/firestore";
import { Clock, Maximize2, Bot, AlertTriangle, ChevronRight, Send } from "lucide-react";
import { assignRobotForOrder } from "../../robotDispatch";

/**
 * OrderCard Component
 * 
 * @param {Object} props
 * @param {Object} props.order - Firestore order ticket data
 * @param {Function} props.onAction - Action callback handler
 * @param {Date} props.currentTime - Current synchronized system timestamp
 * @returns {React.ReactElement} Individual ticket card element
 */
function OrderCard({ order, onAction, currentTime }) {
  const items = order.items || [];

  const getStageMinutes = (start) => {
    if (!start) return 0;
    const startDate = start instanceof Timestamp ? start.toDate() : new Date(start);
    return Math.floor((currentTime - startDate) / 60000);
  };

  const formatElapsedTime = (start) => {
    if (!start) return "00:00";
    const startDate = start instanceof Timestamp ? start.toDate() : new Date(start);
    const diff = Math.max(0, Math.floor((currentTime - startDate) / 1000));
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case "new":
        return {
          label: "NEW ORDER",
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          barColor: "border-l-emerald-500",
        };
      case "progress":
        return {
          label: "PREPPING",
          color: "bg-blue-50 text-blue-700 border-blue-200",
          barColor: "border-l-blue-600 border-t-blue-600",
        };
      case "ready":
        return {
          label: "READY / DISPATCH",
          color: "bg-amber-50 text-amber-700 border-amber-200",
          barColor: "border-l-amber-500 border-t-amber-500",
        };
      case "completed":
        return {
          label: "COMPLETED",
          color: "bg-gray-100 text-gray-700 border-gray-200",
          barColor: "border-l-gray-400",
        };
      default:
        return {
          label: "ORDER",
          color: "bg-gray-50 text-gray-500 border-gray-200",
          barColor: "border-l-gray-300",
        };
    }
  };

  const statusInfo = getStatusInfo(order.status);
  const stageStartTime = order.statusUpdatedAt || order.createdAt || order.time;
  const stageMinutes = getStageMinutes(stageStartTime);
  const isUrgent = order.status === "progress" && stageMinutes >= 10;
  const remainingItemsCount = items.length > 3 ? items.length - 3 : 0;

  return (
    <div
      onClick={() => onAction(order)}
      className={`group relative bg-white rounded-3xl border-2 sm:border-3 border-gray-200 p-4 sm:p-5 lg:p-6 cursor-pointer transition-all duration-200 hover:border-gray-900 hover:shadow-2xl flex flex-col justify-between active:scale-[0.99] select-none ${statusInfo.barColor} ${
        isUrgent ? "ring-4 ring-red-400/50 bg-red-50/20" : ""
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start gap-2">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tighter italic">
              #{order.id.slice(-4).toUpperCase()}
            </span>
            {order.type && (
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                {order.type}
              </span>
            )}
          </div>
          {order.table && (
            <span className="text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest block mt-0.5">
              Table {order.table}
            </span>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-[9px] sm:text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border shadow-xs ${statusInfo.color}`}
          >
            {statusInfo.label}
          </span>
          {isUrgent && (
            <span className="flex items-center gap-1 text-[9px] font-black text-red-600 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full animate-pulse">
              <AlertTriangle size={10} /> LATE ({stageMinutes}m)
            </span>
          )}
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 flex flex-col justify-center py-4 space-y-2.5 my-1">
        {items.length > 0 ? (
          <>
            {items.slice(0, 3).map((item, i) => (
              <div key={i} className="flex gap-2.5 items-center">
                <span className="text-xs font-black text-gray-900 bg-gray-100 min-w-7 h-7 px-1 rounded-lg flex items-center justify-center border border-gray-200 shrink-0">
                  {item.qty || item.quantity || 1}x
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-extrabold text-gray-800 leading-tight truncate uppercase tracking-tight">
                    {item.name || item.itemName || "Item"}
                  </p>
                  {(item.note || item.mod || item.modifier) && (
                    <p className="text-[10px] font-bold text-amber-700 truncate">
                      • {item.note || item.mod || item.modifier}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {remainingItemsCount > 0 && (
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider italic pt-0.5">
                + {remainingItemsCount} more {remainingItemsCount === 1 ? "item" : "items"}...
              </span>
            )}
          </>
        ) : (
          <p className="text-xs font-bold text-gray-400 uppercase italic tracking-widest">
            No item details
          </p>
        )}
      </div>

      {/* Footer / Timer */}
      <div className="flex justify-between items-end shrink-0 pt-3 border-t border-gray-100 mt-1">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">
            <Clock size={12} className="text-gray-700" />
            <span>In stage: {stageMinutes}m</span>
          </div>
          {order.assignedRobot && (
            <div className="flex items-center gap-1 text-[9px] font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider w-fit">
              <Bot size={11} /> {order.assignedRobot.toUpperCase()}
            </div>
          )}
        </div>

        {order.status === "progress" && (
          <div className="text-blue-600 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
            <span className="font-mono font-black text-sm sm:text-base tracking-tighter tabular-nums text-gray-900">
              {formatElapsedTime(stageStartTime)}
            </span>
          </div>
        )}

        {order.status === "ready" && !order.assignedRobot && (
          <button
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await assignRobotForOrder(order, "swagbot1");
              } catch (err) {
                console.error("Card robot assignment error:", err);
              }
            }}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-md transition-all"
            title="Dispatch Swagbot1 for this order"
          >
            <Send size={11} /> Dispatch Bot
          </button>
        )}
      </div>

      {/* Quick hover indicator */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="w-8 h-8 bg-gray-900/90 rounded-xl flex items-center justify-center shadow-lg">
          <Maximize2 size={14} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default OrderCard;
