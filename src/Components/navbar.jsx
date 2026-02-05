import React, { useState } from "react";
import { Search, Menu, X } from "lucide-react";

const Navbar = () => {
  // Controls mobile menu open/close
  const [open, setOpen] = useState(false);

  // Tracks which link is active (underlined)
  const [active, setActive] = useState("Home");

  // Shared link styling logic
  const linkClass = (name) =>
    `font-semibold transition cursor-pointer
     ${
       active === name
         ? "underline underline-offset-8 text-[#2D281A]"
         : "hover:text-[#E25540]"
     }`;

  return (
    <nav className="bg-transparent mt-2 top-0 z-50">
      <div className="max-w-8xl mx-auto py-6">
        {/* TOP BAR */}
        <div className="flex items-center justify-between gap-4">
          {/* LEFT – Desktop Nav */}
          <div className="hidden md:flex gap-10 items-center text-[]#2D281A">
            {["Home", "Menu", "Contact"].map((item) => (
              <a
                key={item}
                onClick={() => setActive(item)}
                className={linkClass(item)}
              >
                {item}
              </a>
            ))}
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-md hover:bg-orange-100 transition"
            aria-label="Toggle menu"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* LOGO */}
          <div className="flex-1 flex justify-center">
            <div className="text-2xl font-bold text-accent">LOGO</div>
          </div>

          {/* SEARCH */}
          <div className="flex items-center bg-[#E25540] rounded-full px-4 py-1">
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent outline-none w-20 md:w-32 text-white placeholder-white"
            />
            <Search size={15} className="text-white cursor-pointer" />
          </div>
        </div>

        {/* MOBILE DROPDOWN */}
        {open && (
          <div className="md:hidden mt-4 bg-white rounded-xl shadow-lg p-4">
            <nav className="flex flex-col gap-4 text-center">
              {["Home", "Menu", "Contact"].map((item) => (
                <a
                  key={item}
                  onClick={() => {
                    setActive(item);
                    setOpen(false);
                  }}
                  className={linkClass(item)}
                >
                  {item}
                </a>
              ))}
            </nav>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
