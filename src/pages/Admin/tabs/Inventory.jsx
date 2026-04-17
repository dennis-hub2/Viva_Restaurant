import React, { useState, useEffect } from "react";
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "../../../firebase";

const InventoryTab = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const menuRef = collection(db, "menuItems");
    const q = query(menuRef, orderBy("name", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inventoryData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        stock: doc.data().stock || 0 // Ensure stock exists
      }));
      setItems(inventoryData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateStock = async (itemId, amount) => {
    try {
      const itemRef = doc(db, "menuItems", itemId);
      const item = items.find(i => i.id === itemId);
      const newStock = Math.max(0, (item.stock || 0) + amount);
      await updateDoc(itemRef, { stock: newStock });
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: "Out of Stock", color: "text-red-500 bg-red-500/10 border-red-500/20" };
    if (stock < 10) return { label: "Low Stock", color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" };
    return { label: "In Stock", color: "text-green-400 bg-green-500/10 border-green-500/20" };
  };

  return (
    <div className="w-full text-left">
      <header className="mb-10 text-left">
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Inventory Control
        </h2>
        <p className="text-gray-400 font-medium mt-1">
          Monitor and manage stock levels for all menu items.
        </p>
      </header>

      {isLoading ? (
        <p className="text-gray-500 animate-pulse">Loading inventory...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const status = getStockStatus(item.stock);
            return (
              <div key={item.id} className="bg-[#2A2A2D] p-6 rounded-[32px] border border-white/5 flex flex-col gap-4 shadow-2xl">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{item.icon || item.emoji || "🍽️"}</span>
                    <div>
                      <h4 className="font-bold text-white text-lg">{item.name}</h4>
                      <p className="text-xs text-gray-500 font-black uppercase tracking-widest">{item.category}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                <div className="bg-[#1A1A1D] rounded-2xl p-4 flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Available Qty</p>
                    <p className="text-2xl font-black text-white">{item.stock}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateStock(item.id, -1)}
                      className="w-10 h-10 bg-[#333338] text-white rounded-xl flex items-center justify-center font-bold hover:bg-red-500 transition-all active:scale-90"
                    >
                      -
                    </button>
                    <button 
                      onClick={() => updateStock(item.id, 1)}
                      className="w-10 h-10 bg-[#6539A3] text-white rounded-xl flex items-center justify-center font-bold hover:bg-green-500 transition-all active:scale-90"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Graphical Progress Bar */}
                <div className="space-y-1">
                  <div className="h-2 w-full bg-[#1A1A1D] rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 ${
                        item.stock === 0 ? 'bg-red-500' : item.stock < 10 ? 'bg-yellow-500' : 'bg-[#6539A3]'
                      }`}
                      style={{ width: `${Math.min(100, (item.stock / 50) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-gray-500 text-right uppercase tracking-widest">Cap: 50 units</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InventoryTab;
