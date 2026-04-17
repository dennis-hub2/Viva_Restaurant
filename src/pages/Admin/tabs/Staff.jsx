import React from "react";

const StaffTab = () => {
  const staff = [
    { id: 1, name: "Marcus Rossi", role: "Head Chef", status: "Active", shift: "Morning", avatar: "👨‍🍳" },
    { id: 2, name: "Elena Sofia", role: "Sous Chef", status: "Active", shift: "Morning", avatar: "👩‍🍳" },
    { id: 3, name: "Luca Bianchi", role: "Kitchen Hand", status: "On Break", shift: "Evening", avatar: "👨‍プロ" },
    { id: 4, name: "Giulia Conti", role: "Floor Manager", status: "Active", shift: "Full Day", avatar: "👩‍💼" },
    { id: 5, name: "Matteo Ricci", role: "Sommelier", status: "Off Duty", shift: "Evening", avatar: "👨‍💼" },
  ];

  return (
    <div className="w-full text-left">
      <header className="mb-10">
        <h2 className="text-4xl font-black text-white tracking-tight">
          Staff Directory
        </h2>
        <p className="text-gray-400 font-medium mt-1">
          Manage your culinary and service team members.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((person) => (
          <div key={person.id} className="bg-[#2A2A2D] p-6 rounded-[32px] border border-white/5 flex items-center gap-6 shadow-2xl group hover:border-white/10 transition-colors">
            <div className="w-20 h-20 bg-[#1A1A1D] rounded-3xl flex items-center justify-center text-4xl shadow-inner group-hover:scale-105 transition-transform">
              {person.avatar}
            </div>
            <div className="flex-1">
              <h4 className="font-black text-white text-lg leading-tight mb-1">{person.name}</h4>
              <p className="text-[#6539A3] text-xs font-black uppercase tracking-widest mb-3">{person.role}</p>
              
              <div className="flex gap-2">
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                  person.status === 'Active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                  person.status === 'On Break' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                  'bg-gray-500/10 text-gray-400 border-gray-500/20'
                }`}>
                  {person.status}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-white/5 text-gray-400 border border-white/5">
                  {person.shift}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Add Staff Button Placeholder */}
        <button className="border-2 border-dashed border-white/5 rounded-[32px] p-6 flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-all text-gray-500 hover:text-[#6539A3] hover:border-[#6539A3]/30">
          <span className="text-4xl leading-none">+</span>
          <span className="text-sm font-black uppercase tracking-widest">Register Staff</span>
        </button>
      </div>
    </div>
  );
};

export default StaffTab;
