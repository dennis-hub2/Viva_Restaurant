import React from "react";
import Navbar from "./navbar.jsx";
import CircleBadge from "./CircleBagde.jsx";

const Hero = () => {
  return (
    <>
      <Navbar />

      <div className="py-10 font-poppins">
        <div
          className="
            max-w-8xl mx-auto
            flex flex-col md:flex-row
            gap-8 md:gap-20
            justify-between
            items-start
          "
        >
          {/* LEFT COLUMN */}
          <div className="md:flex-3 flex flex-col gap-6">
            {/* TEXT BLOCK */}
            <div className="">
              <h1 className="text-4xl md:text-7xl text-[#2D281A] leading-10 md:leading-none mb-3 font-carter">
                Adding flavours
                <br />
                to your meal!
              </h1>

              <p className="max-w-md text-sm leading-4">
                Explore our healthy meal delivery options. Create your own
                recipe by adding flavours to them!
              </p>
            </div>

            {/* buttons */}
            <div className=" flex gap-5 font-semibold [&>a]:rounded-full [&>a]:px-6 [&>a]:py-3 [&>a]:text-white [&>a]:shadow-black/30 [&>a]:transition-all [&>a]:duration-200 [&>a]:hover:shadow-lg [&>a]:active:shadow-lg [&>a]:active:translate-y-px [&>a]:focus-visible:outline-none [&>a]:focus-visible:ring-2 [&>a]:focus-visible:ring-[#E25540] [&>a]:focus-visible:ring-offset-2 ">
              <a href="Menu" className="bg-[#E25540]">
                View Menu
              </a>

              <a href="topMenu.jsx" className="bg-[#728B1B]">
                Top Picks
              </a>
            </div>
          </div>

          {/* CIRCLE IMAGE */}
          <div className="md:flex-2 flex justify-center md:justify-end">
            <CircleBadge />
          </div>
        </div>
      </div>
    </>
  );
};

export default Hero;
