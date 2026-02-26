import React, { useState, useEffect } from "react";


const FormInput = ({ label, value, onChange, type = "text" }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
      {label}
    </label>
    <input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="bg-[#2D2D33] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700]/20 focus:border-[#FFD700]/50 transition-all shadow-inner"
    />
  </div>
);

const FormTextarea = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
      {label}
    </label>
    <textarea
      rows="3"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="bg-[#2D2D33] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700]/20 focus:border-[#FFD700]/50 transition-all shadow-inner resize-none"
    />
  </div>
);

const EditItemModal = ({ isOpen, onClose, item, onSave }) => {
  
  const [formData, setFormData] = useState({
    ...item,
    desc: item?.desc || "",
  });

  
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-[#333338] w-full max-w-lg rounded-3xl shadow-2xl border border-white/10 overflow-hidden transform transition-all">
        <header className="p-8 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-2xl font-black text-white tracking-tight text-left">
            Edit Item
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        <div className="p-8 space-y-6">
          <div className="flex items-center gap-6 mb-2">
            <div className="w-20 h-20 bg-[#2D2D33] rounded-2xl flex items-center justify-center text-4xl border border-white/5">
              {formData.icon}
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">Item Icon</p>
              <p className="text-xs text-gray-500 mt-1">
                Prepared for emoji picker.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-left">
            <FormInput
              label="Item Name"
              value={formData.name}
              onChange={(val) => setFormData({ ...formData, name: val })}
            />
            <FormInput
              label="Category"
              value={formData.category}
              onChange={(val) => setFormData({ ...formData, category: val })}
            />
          </div>

          <div className="text-left">
            <FormInput
              label="Price ($)"
              type="number"
              value={formData.price}
              onChange={(val) =>
                setFormData({
                  ...formData,
                  price: val === "" ? 0 : parseFloat(val),
                })
              }
            />
          </div>

          <div className="text-left">
            <FormTextarea
              label="Description"
              value={formData.desc}
              onChange={(val) => setFormData({ ...formData, desc: val })}
            />
          </div>
        </div>

        <footer className="p-8 bg-[#2D2D33]/50 border-t border-white/5 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold text-sm text-gray-400 hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-8 py-3 bg-[#FFD700] hover:bg-[#ffeb3b] text-black rounded-xl font-black text-sm shadow-lg transition-all active:scale-95"
          >
            Save Changes
          </button>
        </footer>
      </div>
    </div>
  );
};

export default EditItemModal;
