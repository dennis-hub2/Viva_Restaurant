import React, { useEffect, useState } from "react";
import { CloseIcon, BigCartIcon } from "./icons/Icons";

const CartDrawer = ({
  isOpen,
  onClose,
  cartItems,
  onRemoveItem,
  onUpdateQuantity,
  onClearCart,
  onCheckout,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [tableNumber, setTableNumber] = useState("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const handleConfirmClear = () => {
    onClearCart();
    setShowConfirm(false);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-[#332A24]/40 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white">
          <div>
            <h2 className="text-3xl font-black text-[#332A24] font-['Fredoka',_sans-serif]">
              Your Order
            </h2>
            {cartItems.length > 0 && (
              <button
                onClick={() => setShowConfirm(true)}
                className="text-xs font-black text-[#DE6555] hover:text-[#A54538] transition-colors uppercase tracking-widest border-b-2 border-[#DE6555]/30 hover:border-[#DE6555] pb-0.5"
              >
                Clear Order
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-[#FAF1E4] text-[#332A24] rounded-2xl hover:bg-white hover:shadow-md transition-all active:scale-95"
          >
            <CloseIcon />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#FAF1E4]/30">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center mt-10">
              <BigCartIcon />
              <p className="text-gray-500 font-bold text-lg">
                Your cart is empty
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Looks like you haven't added any dishes yet.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-50"
                >
                  <div className="relative text-4xl bg-[#FAF1E4] p-2 rounded-xl h-16 w-16 flex items-center justify-center filter drop-shadow-sm">
                    {item.emoji}
                  </div>

                  <div className="flex-1">
                  <h4 className="font-bold text-[#332A24] leading-tight">
                    {item.name}
                  </h4>
                  <span className="font-bold text-[#DE6555] text-sm">
                    ₵{(item.price * item.quantity).toFixed(2)}
                  </span>
                  </div>
                  <div className="flex items-center bg-gray-100 rounded-full px-2 py-1 gap-3">
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="w-6 h-6 flex items-center justify-center bg-white rounded-full shadow-sm text-[#332A24] font-bold hover:bg-gray-200 transition-colors active:scale-90"
                    >
                      −
                    </button>
                    <span className="font-bold text-[#332A24] min-w-[12px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="w-6 h-6 flex items-center justify-center bg-[#7C903E] rounded-full shadow-sm text-white font-bold hover:bg-[#6a7c35] transition-colors active:scale-90"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Table Number Input */}
        <div className="border-t border-gray-100 bg-gray-50/50 p-4">
          <div className="flex items-center justify-center gap-3 text-sm font-bold text-[#332A24]">
            <span className="flex items-center gap-2">
              <span className="text-lg">🤖</span> Table Number:
            </span>
            <input
              type="number"
              min="1"
              max="4"
              value={tableNumber}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || (Number(val) >= 1 && Number(val) <= 4)) {
                  setTableNumber(val);
                }
              }}
              placeholder="1-4"
              className="w-16 bg-white border-2 border-[#DE6555]/20 rounded-lg py-1 px-2 text-center text-[#DE6555] focus:outline-none focus:border-[#DE6555] focus:ring-2 focus:ring-[#DE6555]/20 transition-all placeholder:text-gray-300 font-black text-lg shadow-sm"
            />
          </div>
          <p className="text-[10px] text-center text-gray-400 mt-2 uppercase tracking-widest">
            Required for Robot Delivery
          </p>
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-white shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-4 font-bold text-lg">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-[#332A24] text-xl">
                ₵{subtotal.toFixed(2)}
              </span>
            </div>
            {/* CHECKOUT BUTTON */}
            <button
              onClick={() => onCheckout(tableNumber)}
              disabled={!tableNumber}
              className="w-full bg-[#DE6555] text-white font-bold text-lg py-4 px-8 rounded-2xl shadow-[0px_4px_0px_#A54538] hover:translate-y-[2px] hover:shadow-[0px_2px_0px_#A54538] transition-all active:translate-y-[4px] active:shadow-none disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {tableNumber
                ? "Proceed to checkout ➔"
                : "Enter Table # to Checkout"}
            </button>
          </div>
        )}

        {/* Confirmation Popup */}
        <div
          className={`absolute inset-0 bg-[#332A24]/90 z-[80] flex items-center justify-center p-8 text-center transition-all duration-300 ${
            showConfirm && isOpen
              ? "opacity-100 visible"
              : "opacity-0 invisible"
          }`}
        >
          <div
            className={`bg-white p-6 rounded-3xl shadow-xl transform transition-transform duration-300 ${
              showConfirm && isOpen ? "scale-100" : "scale-90"
            }`}
          >
            <span className="text-4xl mb-4 block">🗑️</span>
            <h3 className="text-xl font-bold text-[#332A24] mb-2">
              Empty your cart?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              This will remove all items from your order.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirmClear}
                className="w-full bg-[#DE6555] text-white font-bold py-3 rounded-xl active:scale-95 transition-transform"
              >
                Yes, clear it
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full bg-gray-100 text-[#332A24] font-bold py-3 rounded-xl active:scale-95 transition-transform"
              >
                No, keep them
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
