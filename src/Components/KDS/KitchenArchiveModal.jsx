/**
 * @file KitchenArchiveModal.jsx
 * @description Kitchen History Archive Modal for Recalling Completed Orders.
 * 
 * Thesis Context:
 * Enables kitchen staff to inspect historical fulfilled tickets, verify preparation
 * history, and review culinary item breakdowns for audit and reconciliation.
 * 
 * @module Components/KDS/KitchenArchiveModal
 * @author Thesis Research Team
 */

import React from "react";
import { X, Check } from "lucide-react";

/**
 * KitchenArchiveModal Component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility flag
 * @param {Function} props.onClose - Dismissal callback
 * @param {Array<Object>} props.completedList - Array of completed order tickets
 * @param {Function} props.setSelectedOrder - Selection callback to view full ticket
 * @returns {React.ReactElement|null} Archive dialog overlay or null
 */
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
      className="fixed inset-0 z-90 flex items-center justify-center p-3 sm:p-6 md:p-10 bg-gray-900/50 backdrop-blur-md animate-in fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-5xl h-full max-h-[88vh] rounded-3xl sm:rounded-[36px] border-2 sm:border-4 border-gray-200 shadow-2xl flex flex-col overflow-hidden cursor-default animate-in zoom-in-95 select-none"
      >
        <div className="p-4 sm:p-6 md:p-8 border-b-2 sm:border-b-4 border-gray-100 flex justify-between items-center bg-white">
          <div>
            <p className="text-[9px] sm:text-[10px] font-black tracking-[0.3em] text-gray-400 mb-1 uppercase">
              Order Archive
            </p>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tighter italic uppercase">
              Kitchen <span className="text-gray-400">Archive</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 sm:w-14 sm:h-14 bg-gray-100 border-2 border-gray-200 rounded-2xl flex items-center justify-center hover:bg-gray-900 hover:text-white transition-all shadow-xs"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar bg-gray-50">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
            {completedList.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setSelectedOrder(item)}
                className="bg-white border-2 border-gray-200 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center gap-3 animate-in fade-in shadow-xs cursor-pointer hover:border-gray-900 transition-all group"
                style={{ animationDelay: `${idx * 15}ms` }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-gray-900 group-hover:text-white transition-all shadow-2xs">
                  <Check size={20} strokeWidth={3} />
                </div>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-black text-gray-900 tracking-tighter italic">
                    #{item.id.slice(-4).toUpperCase()}
                  </p>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                    {item.displayTime}
                  </p>
                </div>
              </div>
            ))}
            {completedList.length === 0 && (
              <div className="col-span-full p-10 text-center text-sm font-bold text-gray-400 italic">
                No archived orders found
              </div>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6 md:p-8 bg-white border-t-2 sm:border-t-4 border-gray-100 flex justify-between items-center shadow-xs">
          <div className="text-left">
            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
              Total Completed
            </p>
            <p className="text-2xl sm:text-3xl font-black text-gray-900 tabular-nums tracking-tighter">
              {completedList.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-6 sm:px-10 py-3 sm:py-4 bg-gray-900 text-white font-black rounded-2xl text-xs tracking-widest uppercase hover:bg-emerald-600 transition-all shadow-md active:scale-95"
          >
            Back To Terminal
          </button>
        </div>
      </div>
    </div>
  );
}

export default KitchenArchiveModal;
