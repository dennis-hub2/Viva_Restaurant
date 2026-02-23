import React from "react";
import { DecorativeSplash } from "./icons/Icons";

const DecorativeSection = () => {
  return (
    <div className="hidden lg:flex relative items-center justify-center w-full h-full pt-10">
      {/* ADDED 'animate-float' HERE */}
      <div className="w-[480px] h-[480px] relative group animate-float">
        {/* 1. THE SPLASHES: They will now move with the circle */}
        <DecorativeSplash className="absolute -top-4 -right-16 w-24 h-24 text-[#DE6555] rotate-45 z-20" />
        <DecorativeSplash className="absolute -bottom-8 -left-12 w-24 h-24 text-[#DE6555] -rotate-[135deg] z-20" />

        {/* 2. THE IMAGE CONTAINER */}
        <div className="w-full h-full rounded-full border-[6px] border-[#DE6555] overflow-hidden relative z-10 bg-white shadow-2xl">
          <img
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1000"
            alt="Hero Food"
            /* Note: The group-hover scale still works perfectly alongside the float! */
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
          />
          <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
        </div>

        {/* 3. THE GLOW: Also floats for a realistic lighting effect */}
        <div className="absolute inset-0 rounded-full bg-[#DE6555]/10 blur-3xl -z-10 scale-110"></div>
      </div>
    </div>
  );
};

export default DecorativeSection;
