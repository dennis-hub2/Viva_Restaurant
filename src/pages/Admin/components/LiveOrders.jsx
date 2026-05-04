import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../../../firebase";

const OrderRow = ({ order }) => {
  const isReady = order.status === "ready";
  const itemsSummary = order.items?.map(i => `${i.qty}x ${i.name}`).join(", ") || "No items";
  const timeString = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently";

  return (
    <div className="flex items-center justify-between bg-[#222222] hover:bg-[#252525] p-4 rounded-xl border border-white/5 transition-colors cursor-default">
      <div className="flex items-center gap-4 flex-1">
        <span className="text-yellow-500 font-black text-lg">#{order.id.slice(-4)}</span>
        <span className="text-gray-400 text-sm font-medium">
          Table {order.table} <span className="mx-2 opacity-50">•</span>{" "}
          <span className="text-gray-300">{itemsSummary}</span>
        </span>
      </div>
      <div className="flex items-center gap-6">
        <span className="text-gray-500 text-sm font-mono">{timeString}</span>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${
            isReady
              ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
              : "bg-green-500/10 text-green-400 border-green-500/20"
          }`}
        >
          {order.status}
        </span>
      </div>
    </div>
  );
};

const LiveOrders = () => {
  const [activeOrders, setActiveOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ordersRef = collection(db, "orders");
    // Show only new, progress, or ready orders. Delivered goes to history.
    const q = query(
      ordersRef, 
      where("status", "!=", "delivered"),
      orderBy("status"), // Note: This might require a composite index in Firestore
      limit(10)
    );

    // Alternative query if index isn't ready: just get latest 10 and filter in JS
    const simpleQ = query(ordersRef, orderBy("createdAt", "desc"), limit(20));

    const unsubscribe = onSnapshot(simpleQ, (snapshot) => {
      const allRecent = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Active in KDS means status is new or progress (prepping)
      const active = allRecent.filter(o => o.status === "new" || o.status === "progress").slice(0, 5);
      setActiveOrders(active);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-[#2A2A2D] rounded-2xl p-6 border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] text-left">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white font-serif">
          Live Orders
        </h3>
        <span className="bg-green-500/10 text-green-400 text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest border border-green-500/20">
          Live Update
        </span>
      </div>
      
      {isLoading ? (
        <p className="text-gray-500 text-sm animate-pulse">Syncing orders...</p>
      ) : activeOrders.length === 0 ? (
        <div className="py-8 text-center bg-[#1A1A1D] rounded-xl border border-dashed border-white/5">
          <span className="text-3xl block mb-2">😴</span>
          <p className="text-gray-500 text-sm font-bold">No active orders right now.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {activeOrders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveOrders;
