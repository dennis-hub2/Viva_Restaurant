import React from "react";
import { X, Check } from "lucide-react";

function KitchenArchiveModal({
  isOpen,
  onClose,
  completedList,
  setSelectedOrder,
}) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-90 flex items-center justify-center p-12 bg-gray-900/40 backdrop-blur-md animate-in fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-6xl h-full max-h-[85vh] rounded-[48px] border-4 border-gray-200 shadow-[0_40px_100px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden cursor-default animate-in zoom-in-95"
      >
        <div className="p-10 border-b-4 border-gray-100 flex justify-between items-center bg-white">
          <div>
            <p className="text-[10px] font-black tracking-[0.4em] text-gray-400 mb-2 uppercase">
              Order Intelligence
            </p>
            <h2 className="text-5xl font-black text-gray-900 tracking-tighter italic uppercase">
              Kitchen <span className="text-gray-400">Archive</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-20 h-20 bg-gray-100 border-4 border-gray-200 rounded-[28px] flex items-center justify-center hover:bg-gray-900 hover:text-white transition-all shadow-xl"
          >
            <X size={32} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {completedList.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setSelectedOrder(item)}
                className="bg-white border-4 border-gray-200 rounded-3xl p-10 flex flex-col items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-8 shadow-xl cursor-pointer hover:border-gray-900 transition-all group relative overflow-hidden"
                style={{ animationDelay: `${idx * 20}ms` }}
              >
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-gray-900 group-hover:text-white transition-all shadow-inner">
                  <Check size={28} strokeWidth={4} />
                </div>
                <div className="text-center">
                  <p className="text-4xl font-black text-gray-900 mb-1 tracking-tighter italic">
                    #{item.id.slice(-4).toUpperCase()}
                  </p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {item.displayTime}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-12 bg-white border-t-4 border-gray-100 flex justify-between items-center shadow-2xl">
          <div className="flex gap-10">
            <div className="text-left">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Total Orders
              </p>
              <p className="text-5xl font-black text-gray-900 tabular-nums tracking-tighter">
                {completedList.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-16 py-6 bg-gray-900 text-white font-black rounded-3xl text-xs tracking-[0.3em] uppercase hover:bg-emerald-600 transition-all shadow-2xl active:scale-95"
          >
            BACK TO TERMINAL
          </button>
        </div>
      </div>
    </div>
  );
}

export default KitchenArchiveModal;
