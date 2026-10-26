/**
 * @file KitchenDisplay.jsx
 * @description Kitchen Display System (KDS) and Culinary Ticket Dispatching Dashboard.
 * 
 * Thesis Context:
 * Serves as the operational hub for kitchen chefs and expeditors.
 * Real-time features:
 * 1. Live Ticket Queues: Organizes orders dynamically into 'new', 'progress', and 'ready' lanes.
 * 2. Preparation Latency Tracking: Elapsed timers highlight ticket urgency.
 * 3. Cyber-Physical Dispatch Control: Empowers kitchen staff to verify meal loading onto SwagBot1
 *    and trigger automated robotic dispatch to the target dining station.
 * 4. Audit Trail: Archives completed receipts and historical tickets with comprehensive timestamping.
 * 
 * @module pages/KDS/KitchenDisplay
 * @author Thesis Research Team
 */

import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  query,
  doc,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import {
  initDispatchListeners,
  getDispatchStatus,
  runManualDispatch,
  assignRobotForOrder,
} from "../../robotDispatch";
import { db } from "../../firebase";
import { Utensils } from "lucide-react";

import OrderCard from "../../Components/KDS/OrderCard";
import OrderDetailModal from "../../Components/KDS/OrderDetailModal";
import KitchenArchiveModal from "../../Components/KDS/KitchenArchiveModal";
import KdsHeader from "../../Components/KDS/KdsHeader";
import KdsSidebar from "../../Components/KDS/KdsSidebar";
import KdsRecentPanel from "../../Components/KDS/KdsRecentPanel";
import KdsFooter from "../../Components/KDS/KdsFooter";
import KdsReceiptsLog from "../../Components/KDS/KdsReceiptsLog";

/**
 * KitchenDisplay View Component
 * 
 * @returns {React.ReactElement} Comprehensive kitchen workstation display
 */
export default function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [completedList, setCompletedList] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNav, setActiveTab] = useState("ORDERS");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [dispatchEnabled, setDispatchEnabled] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState(getDispatchStatus());
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setDispatchStatus(getDispatchStatus());
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let stopDispatch = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setDispatchEnabled(false);
        if (stopDispatch) {
          stopDispatch();
          stopDispatch = null;
        }
        return;
      }

      try {
        const tokenResult = await user.getIdTokenResult();
        // Relax check: allow backend role, waiter role, or any logged in user (for Spark free plan)
        const isBackend =
          tokenResult.claims?.role === "backend" ||
          tokenResult.claims?.role === "waiter" ||
          !!user;

        setDispatchEnabled(isBackend);

        if (isBackend && !stopDispatch) {
          stopDispatch = initDispatchListeners();
        }

        if (!isBackend && stopDispatch) {
          stopDispatch();
          stopDispatch = null;
        }
      } catch (error) {
        console.error("Failed to read backend claim:", error);
        setDispatchEnabled(false);
        if (stopDispatch) {
          stopDispatch();
          stopDispatch = null;
        }
      }
    });

    return () => {
      unsubscribe();
      if (stopDispatch) {
        stopDispatch();
      }
    };
  }, []);

  const handleManualDispatch = async () => {
    try {
      await runManualDispatch();
      setDispatchStatus(getDispatchStatus());
      setToastMessage("Dispatch checked successfully.");
      setTimeout(() => setToastMessage(""), 3000);
    } catch (error) {
      console.error("Manual dispatch failed:", error);
      setToastMessage("Dispatch check failed.");
      setTimeout(() => setToastMessage(""), 3000);
    }
  };

  const handleAssignRobotNow = async (robotId = "swagbot1") => {
    if (!selectedOrder) return;

    try {
      const res = await assignRobotForOrder(selectedOrder, robotId);
      setDispatchStatus(getDispatchStatus());
      setSelectedOrder((current) =>
        current
          ? {
            ...current,
            assignedRobot: robotId,
            status: "ready",
          }
          : current,
      );
      setToastMessage(`Robot ${robotId.toUpperCase()} assigned & dispatched!`);
      setTimeout(() => setToastMessage(""), 3000);
    } catch (error) {
      console.error("Manual bot assignment failed:", error);
      setToastMessage("Robot assignment failed.");
      setTimeout(() => setToastMessage(""), 3000);
    }
  };

  useEffect(() => {
    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("status", "in", ["new", "progress", "ready"]),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      liveOrders.sort((a, b) => {
        const priority = { new: 1, progress: 2, ready: 3 };
        const statusA = priority[a.status] || 99;
        const statusB = priority[b.status] || 99;
        if (statusA !== statusB) return statusA - statusB;
        return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
      });
      setOrders(liveOrders);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("status", "==", "completed"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allCompleted = snapshot.docs.map((doc) => {
        const data = doc.data();
        const compDate =
          data.completedAt instanceof Timestamp
            ? data.completedAt.toDate()
            : new Date(data.completedAt || Date.now());
        return {
          id: doc.id,
          ...data,
          completedAtRaw: data.completedAt,
          displayTime: compDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
        };
      });
      allCompleted.sort(
        (a, b) =>
          (b.completedAtRaw?.seconds || 0) - (a.completedAtRaw?.seconds || 0),
      );
      setCompletedList(allCompleted.slice(0, 50));
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const orderRef = doc(db, "orders", id);
      const updateData = {
        status: newStatus,
        statusUpdatedAt: Timestamp.now(),
      };
      if (newStatus === "progress") updateData.cookStartedAt = Timestamp.now();
      if (newStatus === "ready") updateData.readyAt = Timestamp.now();
      if (newStatus === "completed") updateData.completedAt = Timestamp.now();
      await updateDoc(orderRef, updateData);

      if (newStatus === "ready") {
        setToastMessage("Order marked ready. Please select a robot to dispatch.");
        setTimeout(() => setToastMessage(""), 3000);
      }

      setSelectedOrder(null);
    } catch (error) {
      console.error("Error updating order:", error);
      setToastMessage("Order update failed.");
      setTimeout(() => setToastMessage(""), 3000);
    }
  };

  const filteredOrders = orders.filter((o) => o.id.includes(searchQuery));

  const renderMainContent = () => {
    let displayOrders = [];
    let emptyLabel = "IDLE";

    switch (activeNav) {
      case "ORDERS":
        displayOrders = filteredOrders;
        emptyLabel = "NO ACTIVE ORDERS";
        break;
      case "PREP":
        displayOrders = filteredOrders.filter((o) => o.status === "progress");
        emptyLabel = "NOTHING IN PREP";
        break;
      case "HISTORY":
        const filteredCompleted = completedList.filter((o) =>
          o.id.includes(searchQuery),
        );
        return (
          <div className="flex-1 p-4 sm:p-6 lg:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 auto-rows-max content-start gap-4 sm:gap-6 overflow-y-auto custom-scrollbar bg-gray-100 min-h-0">
            {filteredCompleted.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onAction={() => setSelectedOrder(order)}
                currentTime={currentTime}
              />
            ))}
          </div>
        );
      case "RECEIPTS":
        return (
          <KdsReceiptsLog
            orders={orders}
            completedList={completedList}
            searchQuery={searchQuery}
            setSelectedOrder={setSelectedOrder}
          />
        );
      default:
        return null;
    }

    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 auto-rows-max content-start gap-4 sm:gap-6 overflow-y-auto custom-scrollbar bg-gray-100 min-h-0">
        {displayOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onAction={() => setSelectedOrder(order)}
            currentTime={currentTime}
          />
        ))}
        {displayOrders.length === 0 && (
          <div className="col-span-full h-full flex flex-col items-center justify-center opacity-30 gap-6">
            <div className="w-24 h-24 border-4 border-dashed border-gray-300 rounded-[40px] flex items-center justify-center">
              <Utensils size={40} className="text-gray-300" />
            </div>
            <span className="text-xs font-black tracking-[0.5em] text-gray-400 uppercase italic">
              {emptyLabel}
            </span>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900 font-black animate-pulse text-2xl tracking-[0.4em] uppercase italic">
          System Ready
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-100 text-gray-900 flex flex-col font-sans overflow-hidden select-none">
      <KdsHeader
        currentTime={currentTime}
        dispatchEnabled={dispatchEnabled}
        dispatchStatus={dispatchStatus}
      />

      <div className="flex flex-1 overflow-hidden">
        <KdsSidebar activeNav={activeNav} setActiveTab={setActiveTab} />

        {/* MAIN CONTENT */}
        <div className="flex-1 bg-gray-100 overflow-hidden flex flex-col min-h-0">
          {renderMainContent()}
        </div>

        <KdsRecentPanel
          completedList={completedList}
          setSelectedOrder={setSelectedOrder}
          setShowAllHistory={setShowAllHistory}
        />
      </div>

      <KitchenArchiveModal
        isOpen={showAllHistory}
        onClose={() => setShowAllHistory(false)}
        completedList={completedList}
        setSelectedOrder={setSelectedOrder}
      />

      <KdsFooter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        pendingCount={orders.filter((o) => o.status === "new").length}
        preppingCount={orders.filter((o) => o.status === "progress").length}
      />

      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        currentTime={currentTime}
        dispatchEnabled={dispatchEnabled}
        handleManualDispatch={handleManualDispatch}
        handleAssignRobotNow={handleAssignRobotNow}
        handleUpdateStatus={handleUpdateStatus}
      />

      {toastMessage && (
        <div className="fixed bottom-10 right-6 bg-[#332A24] text-white px-6 py-4 rounded-3xl shadow-2xl z-100 animate-bounce">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
