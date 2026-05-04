import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
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
        stock: doc.data().stock || 0, // Ensure stock exists
      }));
      setItems(inventoryData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateStock = async (itemId, amount) => {
    try {
      const itemRef = doc(db, "menuItems", itemId);
      const item = items.find((i) => i.id === itemId);
      const newStock = Math.max(0, (item.stock || 0) + amount);
      await updateDoc(itemRef, { stock: newStock });
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };

  const getStockStatus = (stock) => {
    if (stock === 0)
      return {
        label: "Out of Stock",
        color: "text-red-500 bg-red-500/10 border-red-500/20",
      };
    if (stock < 10)
      return {
        label: "Low Stock",
        color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
      };
    return {
      label: "In Stock",
      color: "text-green-400 bg-green-500/10 border-green-500/20",
    };
  };

  return (
    <div className="w-full text-left relative">
      <header className="mb-10 text-left border-l-8 border-red-600 pl-8">
        <h2 className="text-5xl font-black text-gray-900 mb-2 tracking-tighter uppercase italic">
          Inventory
        </h2>
        <p className="text-gray-500 text-xs font-black uppercase tracking-[0.3em]">
          Stock Control • Supply Chain Management
        </p>
      </header>

      {isLoading ? (
        <p className="text-gray-400 font-black animate-pulse uppercase tracking-widest text-center py-20">
          Loading inventory data...
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item) => {
            const status = getStockStatus(item.stock);
            return (
              <div
                key={item.id}
                className="bg-white p-8 rounded-[40px] border-4 border-gray-200 flex flex-col gap-6 shadow-xl hover:border-gray-900 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-5">
                    <span className="text-5xl drop-shadow-lg">
                      {item.icon || item.emoji || "🍽️"}
                    </span>
                    <div>
                      <h4 className="font-black text-gray-900 text-xl leading-none uppercase">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                        {item.category}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-3xl p-6 flex items-center justify-between border-2 border-gray-100">
                  <div className="text-left">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      In Stock
                    </p>
                    <p className="text-4xl font-black text-gray-900 tabular-nums leading-none">
                      {item.stock}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => updateStock(item.id, -1)}
                      className="w-14 h-14 bg-white border-4 border-gray-200 text-gray-900 rounded-2xl flex items-center justify-center text-2xl font-black hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm active:scale-90"
                    >
                      -
                    </button>
                    <button
                      onClick={() => updateStock(item.id, 1)}
                      className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-2xl font-black hover:bg-emerald-600 transition-all shadow-lg active:scale-90"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Graphical Progress Bar */}
                <div className="space-y-2 px-2">
                  <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden border-2 border-gray-200">
                    <div
                      className={`h-full transition-all duration-700 shadow-inner ${
                        item.stock === 0
                          ? "bg-red-600"
                          : item.stock < 10
                            ? "bg-orange-500"
                            : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(100, (item.stock / 50) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
                      Efficiency:{" "}
                      {Math.floor(Math.min(100, (item.stock / 50) * 100))}%
                    </p>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
                      Cap: 50
                    </p>
                  </div>
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
