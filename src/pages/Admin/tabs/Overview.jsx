import React, { useState, useEffect } from "react";
import StatCard from "../components/StatCard";
import LiveOrders from "../components/LiveOrders";
import { collection, onSnapshot, query, where, Timestamp } from "firebase/firestore";
import { db } from "../../../firebase";

const OverviewTab = () => {
  const [stats, setStats] = useState({
    revenue: 0,
    orderCount: 0,
    activeTables: new Set(),
    deliveredCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get orders from today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("createdAt", ">=", Timestamp.fromDate(startOfToday)));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalRevenue = 0;
      let activeTables = new Set();
      let delivered = 0;
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        totalRevenue += data.total || 0;
        
        if (data.status !== "delivered") {
          activeTables.add(data.table);
        } else {
          delivered++;
        }
      });

      setStats({
        revenue: totalRevenue,
        orderCount: snapshot.size,
        activeTables,
        deliveredCount: delivered
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <header className="mb-10 text-left">
        <h2 className="text-4xl font-black text-white mb-2 font-serif tracking-tight">
          System Overview <span className="text-3xl">📊</span>
        </h2>
        <p className="text-gray-400 text-sm font-medium">
          Real-time performance metrics for today.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          icon="💰"
          title="Today's Revenue"
          value={`$${stats.revenue.toFixed(2)}`}
          growth="+100%" // Placeholder for actual comparison logic
          valueColor="text-yellow-500"
        />
        <StatCard
          icon="📦"
          title="Total Orders"
          value={stats.orderCount.toString()}
          growth={stats.isLoading ? "..." : "Live"}
          valueColor="text-green-400"
        />
        <StatCard
          icon="🍽️"
          title="Delivered"
          value={stats.deliveredCount.toString()}
          growth="Today"
          valueColor="text-blue-400"
        />
        <StatCard
          icon="🪑"
          title="Active Tables"
          value={`${stats.activeTables.size} / 5`}
          growth="In Service"
          valueColor="text-purple-400"
        />
      </div>

      <LiveOrders />
    </>
  );
};

export default OverviewTab;
