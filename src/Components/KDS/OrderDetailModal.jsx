import React from "react";
import { Timestamp } from "firebase/firestore";
import { X, Clock, Flame, Utensils, ChevronRight, Check } from "lucide-react";

function OrderDetailModal({
  order,
  onClose,
  currentTime,
  dispatchEnabled,
  handleManualDispatch,
  handleAssignRobotNow,
  handleUpdateStatus,
}) {
  const [selectedBot, setSelectedBot] = React.useState("swagbot1");

  if (!order) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-90 flex items-center justify-center p-3 sm:p-6 bg-gray-900/60 backdrop-blur-md animate-in fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-xl md:max-w-2xl h-full max-h-[92vh] rounded-3xl border-2 sm:border-4 border-gray-200 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 cursor-default"
      >
        {/* Modal Header */}
        <div
          className={`p-4 sm:p-6 md:p-8 flex justify-between items-start shrink-0 border-b border-gray-100 ${
            order.type?.toLowerCase() === "dine in" ? "bg-emerald-50/70" : "bg-orange-50/70"
          }`}
        >
          <div>
            <p className="text-[9px] sm:text-[10px] font-black tracking-[0.3em] text-gray-500 mb-1 uppercase">
              Ticket Details
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter italic">
              #{order.id.slice(-4).toUpperCase()}
            </h2>
            {order.table && (
              <span className="text-xs font-black text-gray-600 uppercase tracking-widest block mt-1">
                Table {order.table}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-2xl flex items-center justify-center hover:bg-gray-100 transition shadow-sm border border-gray-200 shrink-0"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 min-h-0 p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 overflow-y-auto custom-scrollbar bg-white">
          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            <span
              className={`px-4 py-1.5 rounded-xl text-[10px] sm:text-xs font-black tracking-wider border ${
                order.type?.toLowerCase() === "dine in"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-orange-50 text-orange-700 border-orange-200"
              }`}
            >
              {order.type?.toUpperCase() || "ORDER"}
            </span>
            <span className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Clock size={16} className="text-gray-700" />
              Elapsed:{" "}
              {Math.floor(
                (currentTime -
                  ((order.statusUpdatedAt || order.createdAt) instanceof Timestamp
                    ? (order.statusUpdatedAt || order.createdAt).toDate()
                    : new Date(order.statusUpdatedAt || order.createdAt || Date.now()))) /
                  60000
              )}
              m
            </span>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {order.items && order.items.length > 0 ? (
              order.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 sm:gap-6 bg-gray-50 p-4 sm:p-6 rounded-3xl border border-gray-200 shadow-xs group"
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white border border-gray-300 rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl text-gray-900 shrink-0 shadow-xs">
                    {item.qty || item.quantity || 1}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-lg sm:text-2xl font-black text-gray-900 leading-tight uppercase tracking-tight italic">
                      {item.name || item.itemName || "Item"}
                    </p>

                    {(item.note || item.mod || item.sub || item.modifier) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-gray-800 uppercase tracking-wider shadow-2xs">
                          <Flame size={12} className="text-orange-500" />{" "}
                          {item.note || item.mod || item.modifier}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center border-2 border-dashed border-gray-200 rounded-3xl opacity-40">
                <Utensils size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-base font-black uppercase tracking-widest text-gray-400">
                  Ticket Empty
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-6 md:p-8 bg-white border-t border-gray-200 shrink-0">
          {order.status === "new" ? (
            <button
              onClick={() => handleUpdateStatus(order.id, "progress")}
              className="w-full bg-gray-900 hover:bg-emerald-600 text-white font-black py-4 sm:py-5 rounded-2xl text-xs sm:text-sm tracking-[0.3em] transition-all shadow-lg active:scale-98 flex items-center justify-center gap-3 uppercase"
            >
              Start Prep <ChevronRight size={20} strokeWidth={3} />
            </button>
          ) : order.status === "progress" ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => handleUpdateStatus(order.id, "new")}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-black py-4 sm:py-5 rounded-2xl text-xs tracking-wider transition-all border border-gray-200 uppercase"
              >
                Reset Ticket
              </button>
              <button
                onClick={() => handleUpdateStatus(order.id, "ready")}
                className="bg-orange-500 hover:bg-orange-600 text-white font-black py-4 sm:py-5 rounded-2xl text-xs sm:text-sm tracking-wider transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2 uppercase"
              >
                Mark Ready <Flame size={18} strokeWidth={3} />
              </button>
            </div>
          ) : order.status === "ready" ? (
            <div className="flex flex-col gap-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-center">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">
                  Unit Deployment
                </p>
                <p className="text-gray-900 font-black text-lg sm:text-xl tracking-tight italic">
                  {order.assignedRobot
                    ? `Robot ${order.assignedRobot.toUpperCase()} Assigned & En Route`
                    : "Ready - Select Unit for Dispatch"}
                </p>
              </div>

              {/* Robot Selector */}
              <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl flex items-center justify-between gap-3">
                <label className="text-xs font-black uppercase text-gray-700 tracking-wider">
                  Select Robot:
                </label>
                <select
                  value={selectedBot}
                  onChange={(e) => setSelectedBot(e.target.value)}
                  className="bg-white border border-gray-300 font-black text-xs sm:text-sm text-gray-900 px-3 py-1.5 rounded-lg outline-none focus:border-blue-600"
                >
                  <option value="swagbot1">Swagbot 1 (Idle / Docked)</option>
                </select>
              </div>

              <button
                onClick={() => handleAssignRobotNow(selectedBot)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 sm:py-5 rounded-2xl text-xs sm:text-sm tracking-widest transition-all shadow-lg active:scale-98 flex items-center justify-center gap-3 uppercase"
              >
                Dispatch {selectedBot.toUpperCase()} Now <ChevronRight size={20} strokeWidth={3} />
              </button>
            </div>
          ) : order.status === "completed" && !order.assignedRobot ? (
            <div className="flex flex-col gap-3">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-center">
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">
                  Dispatch Missing
                </p>
                <p className="text-gray-900 font-black text-lg tracking-tight italic">
                  This order was completed before robot assignment.
                </p>
              </div>
              <button
                onClick={() => handleAssignRobotNow(selectedBot)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl text-xs tracking-widest transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 uppercase"
              >
                Assign Bot Now
              </button>
              <button
                onClick={() => handleUpdateStatus(order.id, "completed")}
                className="w-full bg-gray-900 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl text-xs tracking-widest transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 uppercase"
              >
                Confirm Delivery <Check size={18} strokeWidth={3} />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default OrderDetailModal;
