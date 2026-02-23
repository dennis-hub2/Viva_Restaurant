import React from "react";

const Hero = () => {
  return (
    /* Increased container width from max-w-md to max-w-3xl */
    <div className="max-w-3xl mt-12 lg:mt-24">
      <h1 className="text-5xl md:text-8xl font-bold text-[#332A24] font-['Carter_One',_cursive] leading-[1.15] mb-6">
        Adding Flavours <br className="hidden sm:block" /> to your meals
      </h1>

      {/* Increased text size slightly to match the bold header */}
      <p className="mt-6 text-gray-600 text-lg leading-relaxed max-w-xl">
        Explore our healthy meal delivery options. Create your own recipe by
        adding flavours to them!
      </p>

      <a
        href="#menu"
        className="inline-block mt-10 bg-[#DE6555] text-white font-bold text-lg py-4 px-10 rounded-full shadow-[0px_6px_0px_#A54538] hover:translate-y-[2px] hover:shadow-[0px_4px_0px_#A54538] transition-all active:translate-y-[6px] active:shadow-none"
      >
        Food Menu
      </a>
    </div>
  );
};

export default Hero;
