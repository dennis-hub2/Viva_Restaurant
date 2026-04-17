import React from "react";
import { DecorativeSplash } from "./icons/Icons";

const ContactSection = () => {
  return (
    <section className="scroll-mt-24 mt-32 pt-10 border-t border-[#332a2415] mb-20" id="contact">
      <div className="flex flex-col lg:flex-row gap-16 items-start">
        {/* Left side: Contact Info */}
        <div className="flex-1 space-y-8">
          <div>
            <h2 className="text-5xl md:text-6xl font-black text-[#332A24] font-['Fredoka',_sans-serif] mb-6">
              Get in Touch
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed max-w-md">
              Have questions about our recipes, delivery, or want to book a table? 
              Our team is always here to help you add more flavours to your life!
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-[#DE6555] p-3 rounded-2xl text-white shadow-lg">
                <span className="text-2xl">📍</span>
              </div>
              <div>
                <h4 className="font-bold text-[#332A24] text-lg">Our Location</h4>
                <p className="text-gray-600">123 Flavour Street, Foodie City, FC 45678</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-[#DE6555] p-3 rounded-2xl text-white shadow-lg">
                <span className="text-2xl">📞</span>
              </div>
              <div>
                <h4 className="font-bold text-[#332A24] text-lg">Phone Number</h4>
                <p className="text-gray-600">+1 (234) 567-890</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-[#DE6555] p-3 rounded-2xl text-white shadow-lg">
                <span className="text-2xl">✉️</span>
              </div>
              <div>
                <h4 className="font-bold text-[#332A24] text-lg">Email Us</h4>
                <p className="text-gray-600">hello@viva-restaurant.com</p>
              </div>
            </div>
          </div>

          {/* Opening Hours Card */}
          <div className="bg-white p-8 rounded-[40px] shadow-xl border-4 border-[#DE6555] relative overflow-hidden group">
            <DecorativeSplash className="absolute -top-6 -right-6 w-20 h-20 text-[#DE6555]/10 rotate-45" />
            <h4 className="font-black text-[#332A24] text-xl mb-4">Opening Hours</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Mon - Fri</span>
                <span className="font-bold">9:00 AM - 10:00 PM</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Sat - Sun</span>
                <span className="font-bold">10:00 AM - 11:00 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Contact Form */}
        <div className="flex-1 w-full">
          <form className="bg-white p-10 rounded-[40px] shadow-2xl space-y-6 relative overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[#332A24] font-bold ml-2">Your Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe"
                  className="w-full bg-[#FAF1E4] rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-[#DE6555] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[#332A24] font-bold ml-2">Email Address</label>
                <input 
                  type="email" 
                  placeholder="john@example.com"
                  className="w-full bg-[#FAF1E4] rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-[#DE6555] transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[#332A24] font-bold ml-2">Subject</label>
              <input 
                type="text" 
                placeholder="How can we help?"
                className="w-full bg-[#FAF1E4] rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-[#DE6555] transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[#332A24] font-bold ml-2">Message</label>
              <textarea 
                rows="4"
                placeholder="Tell us more about your inquiry..."
                className="w-full bg-[#FAF1E4] rounded-3xl py-4 px-6 outline-none focus:ring-2 focus:ring-[#DE6555] transition-all resize-none"
              ></textarea>
            </div>

            <button 
              type="submit"
              className="w-full bg-[#DE6555] text-white font-black text-xl py-5 rounded-2xl shadow-[0px_6px_0px_#A54538] hover:translate-y-[2px] hover:shadow-[0px_4px_0px_#A54538] transition-all active:translate-y-[6px] active:shadow-none mt-4"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
