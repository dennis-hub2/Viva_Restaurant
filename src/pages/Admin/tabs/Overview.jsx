import React from "react";
import StatCard from "../components/StatCard";
import LiveOrders from "../components/LiveOrders";

const OverviewTab = () => (
  <>
    <header className="mb-10">
      <h2 className="text-4xl font-black text-white mb-2 font-serif tracking-tight">
        Good evening, Marcus <span className="text-3xl">👋</span>
      </h2>
      <p className="text-gray-400 text-sm font-medium">
        Here's what's happening at Zenith Eats today.
      </p>
    </header>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      <StatCard
        icon="💰"
        title="Today's Revenue"
        value="$9,284"
        growth="+18%"
        valueColor="text-yellow-500"
      />
      <StatCard
        icon="📦"
        title="Orders Today"
        value="115"
        growth="+12%"
        valueColor="text-green-400"
      />
      <StatCard
        icon="📊"
        title="Avg Order Value"
        value="$42.50"
        growth="+5%"
        valueColor="text-blue-400"
      />
      <StatCard
        icon="🪑"
        title="Active Tables"
        value="12 / 20"
        growth="60%"
        valueColor="text-purple-400"
      />
    </div>

    <LiveOrders />
  </>
);

export default OverviewTab;
