// src/pages/Admin/components/MenuCard.jsx
import React from "react";

// Destructure onEdit and onDelete from props
const MenuCard = ({ item, onEdit, onDelete }) => {
  return (
    <div className="bg-gradient-to-br from-[#404046] to-[#333338] rounded-2xl p-5 shadow-xl border border-white/5 relative group transition-all hover:border-white/10 hover:-translate-y-1">
      {/* Top Right Actions */}
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {/* Edit Button - Blue */}
        <button
          className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"
          onClick={() => onEdit(item)} // Now triggers the modal in the parent
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
              strokeWidth="2"
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>

        {/* Delete Button - Red */}
        <button
          className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
          onClick={() => onDelete(item.id)} // This triggers the parent function
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
              strokeWidth="2"
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
