import React from "react";
import { StarIcon } from "./icons/Icons";

const MenuCard = ({ item, onAddToCart }) => {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col h-full border border-gray-50 hover:-translate-y-1 transition-transform duration-200">
      {/* Emoji Section */}
      <div className="flex-grow flex items-center justify-center mb-8 mt-2">
        <span className="text-[5rem] drop-shadow-lg filter">
          {item.icon || item.emoji || " "}
        </span>
      </div>

      <div className="mt-auto">
        <div className="flex justify-between items-start gap-2 mb-1">
          <h3 className="font-['Fredoka',_sans-serif] font-bold text-xl text-[#332A24] leading-tight">
            {item.name}
          </h3>
          <span className="font-bold text-[#DE6555] text-lg shrink-0">
            ${Number(item.price).toFixed(2)}
          </span>
        </div>

        <p className="text-gray-500 text-sm mb-6 line-clamp-2 min-h-[40px] leading-relaxed">
          {item.desc}
        </p>

        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1 font-bold text-gray-700 text-sm">
            <StarIcon />
            {/* Logic: Use database rating, otherwise fallback to 5.0 */}
            {item.rating || "5.0"}
          </div>

          <button
            onClick={() => onAddToCart(item)}
            className="bg-[#FAF1E4] hover:bg-[#DE6555] text-[#DE6555] hover:text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-colors duration-200 active:scale-95"
          >
            + Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
