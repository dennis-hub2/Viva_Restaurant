import React, { useState, useEffect } from "react";

// --- Sub-Components ---
const FormInput = ({ label, value, onChange, type = "text", placeholder }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-[#2D2D33] border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/20 focus:border-[#FFD700]/50 transition-all shadow-inner text-sm"
    />
  </div>
);

const FormTextarea = ({ label, value, onChange, placeholder }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
      {label}
    </label>
    <textarea
      rows="3"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-[#2D2D33] border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/20 focus:border-[#FFD700]/50 transition-all shadow-inner resize-none text-sm"
    />
  </div>
);

const FormSelect = ({ label, value, onChange, options }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-[#2D2D33] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700]/20 focus:border-[#FFD700]/50 transition-all shadow-inner text-sm appearance-none cursor-pointer"
    >
      <option value="" disabled className="text-gray-500">
        Select category...
      </option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

const AddItemModal = ({ isOpen, onClose, onAdd }) => {
  const categoryOptions = [
    "Burgers",
    "Pasta",
    "Sushi",
    "Ramen",
    "Soups",
    "Mains",
    "Starters",
    "Desserts",
  ];

  const initialState = {
    name: "",
    category: "",
    price: "",
    icon: "🍽️", // Still provides a nice default!
    desc: "",
    popular: false,
    isLive: false,
  };

  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFormData(initialState);
      setError("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.price || !formData.category.trim()) {
      setError("Please fill out the name, price, and select a category.");
      return;
    }

    onAdd({
      ...formData,
      price: parseFloat(formData.price),
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-[#212124] w-full max-w-lg rounded-3xl shadow-2xl border border-white/5 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200 p-8">
        <header className="mb-8 text-left">
          <h2 className="text-2xl font-black text-white tracking-tight font-serif">
            Add New Item
          </h2>
          {error && (
            <p className="text-red-400 text-xs mt-2 font-bold">{error}</p>
          )}
        </header>

        <div className="space-y-6">
          <div className="flex gap-4">
            {/* UPDATED: Emoji is now a manual text input! */}
            <div className="flex flex-col gap-2 w-24">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Emoji
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                className="h-[46px] w-full bg-[#2D2D33] border border-white/5 rounded-xl text-center text-2xl text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700]/20 focus:border-[#FFD700]/50 transition-all shadow-inner"
              />
            </div>

            <div className="flex-1 text-left">
              <FormInput
                label="Name"
                placeholder="Dish name"
                value={formData.name}
                onChange={(val) => setFormData({ ...formData, name: val })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-left">
            <FormInput
              label="Price"
              type="number"
              placeholder="0.00"
              value={formData.price}
              onChange={(val) => setFormData({ ...formData, price: val })}
            />
            <FormSelect
              label="Category"
              options={categoryOptions}
              value={formData.category}
              onChange={(val) => setFormData({ ...formData, category: val })}
            />
          </div>

          <div className="text-left">
            <FormTextarea
              label="Description"
              placeholder="Dish description..."
              value={formData.desc}
              onChange={(val) => setFormData({ ...formData, desc: val })}
            />
          </div>
        </div>

        <footer className="mt-8 flex gap-4">
          <button
            onClick={handleSubmit}
            className="flex-1 py-3.5 bg-[#FFD700] hover:bg-[#ffeb3b] text-black rounded-xl font-black text-sm shadow-lg shadow-yellow-900/20 transition-all active:scale-95"
          >
            Add Item
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3.5 border border-white/10 rounded-xl font-bold text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AddItemModal;
