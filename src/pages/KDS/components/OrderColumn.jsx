import React from "react";

const OrderColumn = ({ title, count, colorData, children }) => (
  <div className="flex flex-col h-full overflow-hidden">
    <div className="flex items-center gap-3 mb-4 px-2">
      <h2 className={`font-black tracking-widest uppercase ${colorData.text}`}>
        {title}
      </h2>
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-bold bg-white/10 ${colorData.text}`}
      >
        {count}
      </span>
    </div>
    {/* Inner scrollable area for cards */}
    <div
      className={`flex-1 overflow-y-auto pr-2 space-y-4 border-t ${colorData.border} pt-4 custom-scrollbar`}
    >
      {children}
    </div>
  </div>
);

export default OrderColumn;
