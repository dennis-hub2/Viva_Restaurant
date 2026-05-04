import React, { useState, useEffect } from "react";
import StatCard from "../components/StatCard";
import LiveOrders from "../components/LiveOrders";
import {
  collection,
  onSnapshot,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../firebase";

const OverviewTab = () => {
  const [stats, setStats] = useState({
    revenue: 0,
    orderCount: 0,
    activeTables: new Set(),
    deliveredCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get orders from today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("createdAt", ">=", Timestamp.fromDate(startOfToday)),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalRevenue = 0;
      let activeTables = new Set();
      let delivered = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        totalRevenue += data.total || 0;

        // Sync with KDS statuses: only new and progress are truly 'active' in kitchen
        if (
          data.status === "new" ||
          data.status === "progress" ||
          data.status === "ready"
        ) {
          activeTables.add(data.table);
        } else {
          delivered++;
        }
      });

      setStats({
        revenue: totalRevenue,
        orderCount: snapshot.size,
        activeTables,
        deliveredCount: delivered,
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <header className="mb-10 text-left border-l-8 border-red-600 pl-8">
        <h2 className="text-5xl font-black text-gray-900 mb-2 tracking-tighter uppercase italic">
          Overview
        </h2>
        <p className="text-gray-500 text-xs font-black uppercase tracking-[0.3em]">
          Real-time Command Hub • Today's Activity
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <StatCard
          icon="💰"
          title="Today's Revenue"
          value={`₵${stats.revenue.toFixed(2)}`}
          growth="+100%"
          valueColor="text-gray-900"
        />
        <StatCard
          icon="📦"
          title="Total Orders"
          value={stats.orderCount.toString()}
          growth={isLoading ? "..." : "Live"}
          valueColor="text-blue-600"
        />
        <StatCard
          icon="✅"
          title="Delivered"
          value={stats.deliveredCount.toString()}
          growth="Today"
          valueColor="text-emerald-600"
        />
        <StatCard
          icon="🪑"
          title="Active Tables"
          value={`${stats.activeTables.size} / 4`}
          growth="In Service"
          valueColor="text-orange-600"
        />
      </div>

      <LiveOrders />
    </>
  );
};

export default OverviewTab;
