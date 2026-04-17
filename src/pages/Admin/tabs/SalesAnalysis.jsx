import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../../firebase";
import StatCard from "../components/StatCard";

const SalesAnalysis = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgValue: 0,
    categorySales: {}
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let revenue = 0;
      let catSales = {};
      
      const allOrders = snapshot.docs.map(doc => {
        const data = doc.data();
        revenue += data.total || 0;
        
        data.items?.forEach(item => {
          // Note: Category isn't stored in the order item usually, 
          // so we'll track by item name as a proxy for popularity
          catSales[item.name] = (catSales[item.name] || 0) + item.qty;
        });
        
        return { id: doc.id, ...data };
      });

      setStats({
        totalRevenue: revenue,
        totalOrders: snapshot.size,
        avgValue: snapshot.size > 0 ? revenue / snapshot.size : 0,
        categorySales: catSales
      });
      setOrders(allOrders);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const topItems = Object.entries(stats.categorySales)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="w-full text-left">
      <header className="mb-10">
        <h2 className="text-4xl font-black text-white tracking-tight">
          Sales Analysis
        </h2>
        <p className="text-gray-400 font-medium mt-1">
          Historical performance and sales insights.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard
          icon="💰"
          title="Total Lifetime Revenue"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          growth="Total"
          valueColor="text-yellow-500"
        />
        <StatCard
          icon="📦"
          title="All-Time Orders"
          value={stats.totalOrders.toString()}
          growth="Count"
          valueColor="text-green-400"
        />
        <StatCard
          icon="📈"
          title="Avg. Order Value"
          value={`$${stats.avgValue.toFixed(2)}`}
          growth="Performance"
          valueColor="text-blue-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular Dishes Chart (Simplified as Bars) */}
        <div className="bg-[#2A2A2D] p-8 rounded-[40px] border border-white/5 shadow-2xl">
          <h3 className="text-xl font-black text-white mb-6 font-serif">Top Selling Dishes</h3>
          <div className="space-y-6">
            {topItems.map(([name, qty], index) => {
              const maxQty = topItems[0][1];
              const percentage = (qty / maxQty) * 100;
              
              return (
                <div key={name} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-300">{index + 1}. {name}</span>
                    <span className="text-white">{qty} sold</span>
                  </div>
                  <div className="h-3 w-full bg-[#1A1A1D] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#6539A3] to-[#4B1E83] transition-all duration-1000"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {topItems.length === 0 && (
              <p className="text-gray-500 text-center py-10">No sales data recorded yet.</p>
            )}
          </div>
        </div>

        {/* Recent Trends Summary */}
        <div className="bg-[#2A2A2D] p-8 rounded-[40px] border border-white/5 shadow-2xl">
          <h3 className="text-xl font-black text-white mb-6 font-serif">Recent Orders</h3>
          <div className="overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">
                  <th className="pb-4">Order ID</th>
                  <th className="pb-4">Total</th>
                  <th className="pb-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="text-sm">
                    <td className="py-4 text-gray-300 font-mono">#{order.id.slice(-6).toUpperCase()}</td>
                    <td className="py-4 font-bold text-white">${order.total?.toFixed(2)}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        order.status === 'delivered' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesAnalysis;