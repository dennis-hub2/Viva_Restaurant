import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../firebase";

const StaffTab = () => {
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: "",
    role: "Server",
    status: "Active",
    shift: "Morning",
    avatar: "👨‍🍳",
  });

  useEffect(() => {
    const staffRef = collection(db, "staff");
    const unsubscribe = onSnapshot(staffRef, (snapshot) => {
      const staffData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStaff(staffData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "staff"), newStaff);
      setIsModalOpen(false);
      setNewStaff({
        name: "",
        role: "Server",
        status: "Active",
        shift: "Morning",
        avatar: "👨‍🍳",
      });
    } catch (error) {
      console.error("Error adding staff:", error);
    }
  };

  const handleDeleteStaff = async (id) => {
    if (window.confirm("Are you sure you want to remove this staff member?")) {
      try {
        await deleteDoc(doc(db, "staff", id));
      } catch (error) {
        console.error("Error deleting staff:", error);
      }
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const statuses = ["Active", "On Break", "Off Duty"];
    const nextStatus =
      statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];
    try {
      await updateDoc(doc(db, "staff", id), { status: nextStatus });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div className="w-full text-left">
      <header className="mb-10 flex justify-between items-end">
        <div className="border-l-8 border-red-600 pl-8 text-left">
          <h2 className="text-5xl font-black text-gray-900 mb-2 tracking-tighter uppercase italic">
            Staff
          </h2>
          <p className="text-gray-500 text-xs font-black uppercase tracking-[0.3em]">
            Manage your culinary and service team members
          </p>
        </div>
        <div className="text-xs bg-[#6539A3] text-white px-3 py-1 rounded-full font-black uppercase tracking-widest mb-2">
          {staff.length} Members
        </div>
      </header>

      {isLoading ? (
        <div className="py-20 text-center animate-pulse text-gray-500 font-bold uppercase tracking-widest">
          Syncing staff records...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((person) => (
            <div
              key={person.id}
              className="bg-[#2A2A2D] p-6 rounded-[32px] border border-white/5 flex flex-col gap-4 shadow-2xl group hover:border-white/10 transition-colors relative overflow-hidden"
            >
              <button
                onClick={() => handleDeleteStaff(person.id)}
                className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                ✕
              </button>

              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-[#1A1A1D] rounded-3xl flex items-center justify-center text-4xl shadow-inner group-hover:scale-105 transition-transform">
                  {person.avatar || "👤"}
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-white text-lg leading-tight mb-1">
                    {person.name}
                  </h4>
                  <p className="text-[#6539A3] text-xs font-black uppercase tracking-widest mb-3">
                    {person.role}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleStatus(person.id, person.status)}
                      className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border transition-colors ${
                        person.status === "Active"
                          ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                          : person.status === "On Break"
                            ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20"
                            : "bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20"
                      }`}
                    >
                      {person.status}
                    </button>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-white/5 text-gray-400 border border-white/5">
                      {person.shift}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add Staff Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="border-2 border-dashed border-white/5 rounded-[32px] p-6 flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-all text-gray-500 hover:text-[#6539A3] hover:border-[#6539A3]/30 min-h-[140px]"
          >
            <span className="text-4xl leading-none">+</span>
            <span className="text-sm font-black uppercase tracking-widest">
              Register Staff
            </span>
          </button>
        </div>
      )}

      {/* Simple Modal for Adding Staff */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1A1D] w-full max-w-md rounded-[40px] border border-white/10 p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-white mb-6">
              New Staff Member
            </h3>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">
                  Full Name
                </label>
                <input
                  required
                  type="text"
                  value={newStaff.name}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, name: e.target.value })
                  }
                  className="w-full bg-[#2A2A2D] border border-white/5 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-[#6539A3] transition-colors"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">
                    Role
                  </label>
                  <select
                    value={newStaff.role}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, role: e.target.value })
                    }
                    className="w-full bg-[#2A2A2D] border border-white/5 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-[#6539A3] transition-colors"
                  >
                    <option>Head Chef</option>
                    <option>Sous Chef</option>
                    <option>Server</option>
                    <option>Floor Manager</option>
                    <option>Kitchen Hand</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">
                    Shift
                  </label>
                  <select
                    value={newStaff.shift}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, shift: e.target.value })
                    }
                    className="w-full bg-[#2A2A2D] border border-white/5 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-[#6539A3] transition-colors"
                  >
                    <option>Morning</option>
                    <option>Evening</option>
                    <option>Full Day</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">
                  Avatar Emoji
                </label>
                <input
                  type="text"
                  value={newStaff.avatar}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, avatar: e.target.value })
                  }
                  className="w-full bg-[#2A2A2D] border border-white/5 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-[#6539A3] transition-colors text-2xl text-center"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl bg-white/5 text-gray-400 font-bold hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 rounded-2xl bg-[#6539A3] text-white font-bold hover:bg-[#7a49c2] transition-all shadow-lg shadow-[#6539A3]/20"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffTab;
