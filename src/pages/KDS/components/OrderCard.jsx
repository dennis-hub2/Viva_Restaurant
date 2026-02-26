import React from "react";

const OrderCard = ({ order, accent, children }) => (
  <div className="bg-[#1A1A1A] rounded-xl p-5 border border-white/5 shadow-lg relative">
    {/* Card Header: Order ID & Table Number */}
    <div className="flex justify-between items-start mb-4">
      <div>
        <span className={`text-xl font-black ${accent}`}>#{order.id}</span>
        <span className="text-gray-400 text-sm ml-3 font-medium">
          Table {order.table}
        </span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-gray-500 text-xs">{order.timeElapsed}</span>
        {order.isLate && (
          <span className="text-red-500 text-xs font-bold mt-1 uppercase">
            ⚠ Late
          </span>
        )}
      </div>
    </div>

    {/* Items List */}
    <div className="space-y-3">
      {order.items.map((item, idx) => (
        <div key={idx} className="bg-[#222] rounded p-3">
          <div className="flex items-center gap-3 text-sm">
            <span
              className={`font-bold px-2 py-0.5 rounded bg-white/5 ${accent}`}
            >
              ×{item.qty}
            </span>
            <span className="font-bold text-gray-200">{item.name}</span>
          </div>
          {item.note && (
            <div className="text-gray-500 text-xs mt-1.5 ml-10 flex items-center gap-1">
              <span className="text-red-400">📝</span> {item.note}
            </div>
          )}
        </div>
      ))}
    </div>

    {/* Action Button (passed via children) */}
    {children}
  </div>
);

export default OrderCard;
