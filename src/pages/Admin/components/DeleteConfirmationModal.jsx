// src/pages/Admin/components/DeleteConfirmationModal.jsx
import React, { useEffect } from "react";

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName }) => {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-[#333338] w-full max-w-md rounded-3xl shadow-2xl border border-white/10 p-8 text-center animate-in fade-in zoom-in duration-200">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 border border-red-500/20">
          🗑️
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight mb-2">
          Delete Item?
        </h2>
        <p className="text-gray-400 text-sm mb-10">
          Are you sure you want to remove{" "}
          <span className="text-white font-bold">"{itemName}"</span>? This
          action cannot be undone.
        </p>

        <div className="flex gap-4 mt-8">
          <button
            onClick={onConfirm}
            className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-black text-sm shadow-[0px_4px_0px_#991B1B] hover:translate-y-[1px] hover:shadow-[0px_3px_0px_#991B1B] transition-all active:translate-y-[4px] active:shadow-none"
          >
            Confirm Delete
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-[#2D2D33] text-gray-400 border border-white/10 rounded-2xl font-bold text-sm hover:bg-[#3D3D43] hover:text-white transition-all active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
