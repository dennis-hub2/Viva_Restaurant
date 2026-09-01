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
      className="fixed inset-0 z-90 flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-md animate-in fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-2xl h-full max-h-[90vh] rounded-3xl border-4 border-gray-200 shadow-[0_40px_120px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 cursor-default"
      >
        {/* Modal Header */}
        <div
          className={`p-10 flex justify-between items-start shrink-0 ${order.type?.toLowerCase() === "dine in"
              ? "bg-emerald-50"
              : "bg-orange-50"
            }`}
        >
          <div>
            <p className="text-[10px] font-black tracking-[0.4em] text-gray-400 mb-2 uppercase">
              Ticket Intelligence
            </p>
            <h2 className="text-6xl font-black text-gray-900 tracking-tighter italic">
              #{order.id.slice(-4).toUpperCase()}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center hover:bg-gray-100 transition-all shadow-lg border-2 border-gray-100"
          >
            <X size={28} className="text-gray-400" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 min-h-0 p-12 space-y-10 overflow-y-auto custom-scrollbar bg-white">
          <div className="flex items-center gap-8">
            <span
              className={`px-6 py-2.5 rounded-2xl text-[11px] font-black tracking-[0.2em] border-2 ${order.type?.toLowerCase() === "dine in"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : "bg-orange-50 text-orange-600 border-orange-100"
                }`}
            >
              {order.type?.toUpperCase() || "ORDER"}
            </span>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-3">
              <Clock size={20} className="text-gray-900" />
              Time Elapsed:{" "}
              {Math.floor(
                (currentTime -
                  ((order.statusUpdatedAt || order.createdAt) instanceof Timestamp
                    ? (order.statusUpdatedAt || order.createdAt).toDate()
                    : new Date(
                      order.statusUpdatedAt ||
                      order.createdAt ||
                      Date.now(),
                    ))) /
                60000,
              )}
              m
            </span>
          </div>

          <div className="space-y-6">
            {order.items && order.items.length > 0 ? (
              order.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-8 bg-gray-50 p-8 rounded-[40px] border-2 border-gray-100 shadow-sm group transition-all hover:border-gray-900"
                >
                  <div className="w-20 h-20 bg-white border-2 border-gray-200 rounded-3xl flex items-center justify-center font-black text-4xl text-gray-900 shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                    {item.qty}
                  </div>
                  <div className="flex-1 pt-2">
                    <p className="text-3xl font-black text-gray-900 leading-tight uppercase tracking-tight italic">
                      {item.name}
                    </p>

                    {(item.note ||
                      item.mod ||
                      item.sub ||
                      item.modifier) && (
                        <div className="mt-4 flex flex-wrap gap-3">
                          {(item.note || item.mod || item.modifier) && (
                            <div className="inline-flex items-center gap-3 px-5 py-2 bg-white border-2 border-gray-200 rounded-2xl text-[11px] font-black text-gray-900 uppercase tracking-widest shadow-sm">
                              <Flame size={16} className="text-orange-500" />{" "}
                              {item.note || item.mod || item.modifier}
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-20 text-center border-4 border-dashed border-gray-100 rounded-[64px] opacity-30">
                <Utensils
                  size={80}
                  className="mx-auto mb-8 text-gray-200"
                />
                <p className="text-2xl font-black uppercase tracking-[0.3em] text-gray-300">
                  Ticket Empty
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-12 bg-white border-t-4 border-gray-100 grid grid-cols-1 gap-6 shadow-[0_-20px_50px_rgba(0,0,0,0.02)] shrink-0">
          {order.status === "new" ? (
            <button
              onClick={() => handleUpdateStatus(order.id, "progress")}
              className="w-full bg-gray-900 hover:bg-emerald-600 text-white font-black py-7 rounded-3xl text-sm tracking-[0.5em] transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-5 uppercase"
            >
              Start Prep <ChevronRight size={24} strokeWidth={4} />
            </button>
          ) : order.status === "progress" ? (
            <div className="grid grid-cols-2 gap-6">
              <button
                onClick={() => handleUpdateStatus(order.id, "new")}
                className="bg-gray-100 hover:bg-gray-200 text-gray-500 font-black py-7 rounded-3xl text-xs tracking-[0.2em] transition-all border-2 border-gray-200 uppercase"
              >
                Reset Ticket
              </button>
              <button
                onClick={() => handleUpdateStatus(order.id, "ready")}
                className="bg-orange-500 hover:bg-gray-900 text-white font-black py-7 rounded-3xl text-sm tracking-[0.3em] transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-5 uppercase"
              >
                Mark Ready <Flame size={24} strokeWidth={4} />
              </button>
            </div>
          ) : order.status === "ready" ? (
            <div className="flex flex-col gap-6">
              <div className="bg-blue-50 border-2 border-blue-100 p-6 rounded-3xl text-center shadow-inner">
                <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.5em] mb-2">
                  Unit Deployment
                </p>
                <p className="text-gray-900 font-black text-2xl tracking-tighter italic">
                  {order.assignedRobot
                    ? `Robot ${order.assignedRobot.toUpperCase()} Assigned & En Route`
                    : "Ready - Select Unit for Dispatch"}
                </p>
              </div>

              {/* Robot Selector */}
              <div className="bg-gray-50 border-2 border-gray-200 p-4 rounded-2xl flex items-center justify-between gap-4">
                <label className="text-xs font-black uppercase text-gray-700 tracking-wider">
                  Select Robot:
                </label>
                <select
                  value={selectedBot}
                  onChange={(e) => setSelectedBot(e.target.value)}
                  className="bg-white border-2 border-gray-300 font-black text-sm text-gray-900 px-4 py-2 rounded-xl outline-none focus:border-blue-600"
                >
                  <option value="swagbot1">Swagbot 1 (Idle / Docked)</option>
                </select>
              </div>

              <button
                onClick={() => handleAssignRobotNow(selectedBot)}
                className="w-full bg-emerald-600 hover:bg-gray-900 text-white font-black py-6 rounded-3xl text-sm tracking-[0.3em] transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-5 uppercase"
              >
                Dispatch {selectedBot.toUpperCase()} Now <ChevronRight size={24} strokeWidth={4} />
              </button>
            </div>
          ) : order.status === "completed" && !order.assignedRobot ? (
            <div className="flex flex-col gap-8">
              <div className="bg-amber-50 border-2 border-amber-100 p-8 rounded-3xl text-center shadow-inner">
                <p className="text-[11px] font-black text-amber-600 uppercase tracking-[0.5em] mb-3">
                  Dispatch Missing
                </p>
                <p className="text-gray-900 font-black text-2xl tracking-tighter italic">
                  This order was completed before robot assignment.
                </p>
              </div>
              <button
                onClick={handleAssignRobotNow}
                className="w-full bg-emerald-600 hover:bg-gray-900 text-white font-black py-7 rounded-3xl text-sm tracking-[0.3em] transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-5 uppercase"
              >
                Assign Bot Now
              </button>
              <button
                onClick={() => handleUpdateStatus(order.id, "completed")}
                className="w-full bg-gray-900 hover:bg-emerald-600 text-white font-black py-7 rounded-3xl text-sm tracking-[0.3em] transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-5 uppercase"
              >
                Confirm Delivery <Check size={24} strokeWidth={4} />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default OrderDetailModal;
