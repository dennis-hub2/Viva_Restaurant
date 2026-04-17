// src/pages/Admin/components/MenuCard.jsx
import React from "react";

// Destructure onEdit and onDelete from props
const MenuCard = ({ item, onEdit, onDelete }) => {
  return (
    <div className="bg-gradient-to-br from-[#404046] to-[#333338] rounded-3xl p-5 shadow-xl border border-white/10 relative group transition-all hover:-translate-y-1">
      {/* Top Right Actions - Now always visible for better usability */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        {/* Edit Button - Bold Purple/Blue */}
        <button
          className="p-2.5 bg-[#6539A3] text-white rounded-xl shadow-lg hover:bg-[#7a4bc0] transition-all active:scale-90 border border-white/10"
          onClick={() => onEdit(item)}
          title="Edit Item"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>

        {/* Delete Button - Bold Red */}
        <button
          className="p-2.5 bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-500 transition-all active:scale-90 border border-white/10"
          onClick={() => onDelete(item.id)}
          title="Delete Item"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* Icon Placeholder */}
      <div className="w-14 h-14 bg-[#333338] rounded-2xl flex items-center justify-center text-3xl shadow-inner mb-4 border border-white/5">
        {item.icon}
      </div>

      {/* Category & Name */}
      <span className="text-[10px] uppercase tracking-widest font-bold text-gray-200 bg-white/5 px-2 py-1 rounded-md">
        {item.category}
      </span>
      <h3 className="text-white font-bold text-lg mt-2 truncate">
        {item.name}
      </h3>

      {/* Price and Popular Badge */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-[#FFD700] font-black text-xl tracking-tight">
          ${item.price.toFixed(2)}
        </span>
        {item.popular && (
          <span className="bg-yellow-500/10 text-yellow-500 text-[9px] font-black px-2 py-0.5 rounded border border-yellow-500/20 uppercase">
            Popular
          </span>
        )}
      </div>
    </div>
  );
};

export default MenuCard;
