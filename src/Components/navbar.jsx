import React, { useState } from "react";
import { SearchIcon } from "./icons/Icons";

const Navbar = ({ searchQuery, setSearchQuery, cartItemCount, onOpenCart }) => {
  // 1. Track which link is currently active
  const [activeLink, setActiveLink] = useState("Home");

  const navLinks = [
    { name: "Home", href: "#" },
    { name: "Menu", href: "#menu" },
    { name: "Contact", href: "#" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#FAF1E4] flex flex-col sm:flex-row justify-between items-center py-4 md:py-6 px-6 gap-4 shadow-[0_10px_15px_-10px_rgba(0,0,0,0.1)]">
      {/* Navigation Links - Added 'group' to handle the collective faint effect */}
      <div className="flex space-x-8 font-bold text-[#3B302B] group">
        {navLinks.map((link) => {
          const isActive = activeLink === link.name;

          return (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setActiveLink(link.name)}
              className={`relative pb-1 transition-all duration-300 ease-in-out
                /* 2. Logic: Faint others when the group is hovered, but stay bright if active */
                group-hover:opacity-40 hover:!opacity-100
                ${isActive ? "opacity-100 text-[#3B302B]" : "opacity-100 text-gray-500"}
              `}
            >
              {link.name}

              {/* 3. The Animated Underline */}
              <span
                className={`absolute bottom-0 left-0 h-[2px] bg-[#3B302B] transition-all duration-300
                ${isActive ? "w-full" : "w-0"}`}
              />
            </a>
          );
        })}
      </div>

      {/* Search and Cart Container */}
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                document
                  .getElementById("menu")
                  ?.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="w-full bg-[#DE6555] text-white placeholder-white/80 rounded-full py-2.5 pl-5 pr-12 
             outline-none text-sm shadow-inner transition-all 
             focus:ring-2 focus:ring-[#DE6555] focus:brightness-105"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <SearchIcon />
          </div>
        </div>

        <div
          onClick={onOpenCart}
          className="relative bg-white p-2.5 rounded-full shadow-sm cursor-pointer hover:bg-gray-50 transition-colors active:scale-95"
        >
          <span className="text-lg">🛒</span>
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#7C903E] text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
              {cartItemCount}
            </span>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
