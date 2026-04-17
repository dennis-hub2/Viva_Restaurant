import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "../../../firebase";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ordersRef = collection(db, "orders");
    // Only show delivered orders in history
    const q = query(
      ordersRef,
      where("status", "==", "delivered"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(historyData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching history:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesId = order.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTable = order.table.toString().includes(searchQuery);
    return matchesId || matchesTable;
  });

  return (
    <div className="w-full text-left">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Order History
          </h2>
          <p className="text-gray-400 font-medium mt-1">
            Review all completed and delivered orders.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search ID or Table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#2D2D33] border border-white/5 rounded-2xl py-3 pl-5 pr-12 text-white placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-[#6539A3] transition-all text-sm shadow-inner"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            🔍
          </span>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#6539A3]"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-20 text-center bg-[#2A2A2D] rounded-[40px] border border-dashed border-white/5">
          <span className="text-5xl block mb-4">📂</span>
          <p className="text-gray-400 font-bold text-lg">No delivered orders found.</p>
          <p className="text-gray-500 text-sm mt-1">Check back once the kitchen starts delivering!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div 
              key={order.id}
              className="bg-[#2A2A2D] p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-6 flex-1">
                <div className="bg-[#1A1A1D] h-16 w-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                  ✅
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[#6539A3] font-black tracking-wider">#{order.id.slice(-6).toUpperCase()}</span>
                    <span className="bg-[#6539A3]/10 text-[#6539A3] text-[10px] font-black px-2 py-0.5 rounded uppercase border border-[#6539A3]/20">
                      Table {order.table}
                    </span>
                  </div>
                  <p className="text-gray-300 font-medium text-sm">
                    {order.items?.map(i => `${i.qty}x ${i.name}`).join(", ")}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : "Recently"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between w-full md:w-auto gap-8 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                <div className="text-right">
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Paid</p>
                  <p className="text-2xl font-black text-white">${order.total?.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;