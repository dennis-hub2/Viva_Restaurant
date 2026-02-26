import React from "react";

const OrderRow = ({ order }) => {
  const isReady = order.status === "Ready";

  return (
    <div className="flex items-center justify-between bg-[#222222] hover:bg-[#252525] p-4 rounded-xl border border-white/5 transition-colors cursor-default">
      <div className="flex items-center gap-4 flex-1">
        <span className="text-yellow-500 font-black text-lg">#{order.id}</span>
        <span className="text-gray-400 text-sm font-medium">
          Table {order.table} <span className="mx-2 opacity-50">•</span>{" "}
          {order.items}
        </span>
      </div>
      <div className="flex items-center gap-6">
        <span className="text-gray-500 text-sm font-mono">{order.time}</span>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border ${
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
  const mockOrders = [
    {
      id: "4821",
      table: "5",
      items: "Wagyu Burger, Miso Ramen",
      time: "14:32",
      status: "Ready",
    },
    {
      id: "4820",
      table: "2",
      items: "Dragon Roll, Tuna Tartare",
      time: "14:15",
      status: "Delivered",
    },
    {
      id: "4819",
      table: "8",
      items: "Truffle Pasta, Matcha Lava Cake",
      time: "13:58",
      status: "Delivered",
    },
  ];

  return (
    <div className="bg-[#2A2A2D] rounded-2xl p-6 border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <h3 className="text-xl font-bold text-white mb-6 font-serif">
        Live Orders
      </h3>
      <div className="flex flex-col gap-3">
        {mockOrders.map((order) => (
          <OrderRow key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
};

export default LiveOrders;
