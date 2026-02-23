import React from "react";
import { categories } from "../data/menuData";

const CategoryTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div
      className="flex overflow-x-auto gap-3 mb-10 pb-4 w-full"
      style={{ scrollbarWidth: "none" }}
    >
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setActiveTab(cat)}
          className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 ${
            activeTab === cat
              ? "bg-[#DE6555] text-white shadow-md"
              : "bg-white text-gray-500 hover:bg-[#fdece9] hover:text-[#DE6555] shadow-sm"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};

export default CategoryTabs;
