import React from "react";
import { StarIcon } from "./icons/Icons";

const FoodCard = ({ title, price, rating, imageSrc }) => {
  return (
    <div className="relative bg-white rounded-2xl p-5 pt-16 mt-16 shadow-[4px_4px_0px_#5A5A5A] flex flex-col items-center">
      <div className="absolute -top-12 w-28 h-28 rounded-full border-4 border-[#DE6555] overflow-hidden bg-white shadow-sm">
        <img
          src={imageSrc}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="w-full flex justify-between items-center text-[15px] font-bold mt-2 text-[#332A24]">
        <span>${price.toFixed(2)}</span>
        <span className="flex items-center">
          <StarIcon /> {rating.toFixed(1)}
        </span>
      </div>
      <h3 className="w-full text-left font-black text-lg mt-1 italic text-[#332A24]">
        {title}
      </h3>
      <a
        href="#"
        className="w-full text-left text-[#DE6555] text-sm font-bold mt-2 hover:underline flex items-center"
      >
        Order Now <span className="ml-1">&rarr;</span>
      </a>
    </div>
  );
};

export default FoodCard;
