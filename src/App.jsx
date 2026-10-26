/**
 * @file App.jsx
 * @description Master Router and Protected Navigation Architecture.
 * 
 * Thesis Context:
 * The user-facing software is partitioned into four synchronized subsystem interfaces:
 * 1. Customer Ordering Portal (`/`): Digital dining menu, dynamic cart drawer, table selection,
 *    and real-time delivery tracking stepper.
 * 2. Administrative Management System (`/admin`): Authenticated dashboard providing inventory tracking,
 *    live menu editing, staff credential management, and revenue analytics.
 * 3. Kitchen Display System (KDS) (`/kds`): Real-time ticket management queue for kitchen staff,
 *    facilitating dish preparation timing and manual robotic dispatch.
 * 4. Waiter Telemetry Console (`/robot`, `/robot/:id`): Real-time spatial tracking of SwagBot1,
 *    manual waypoint arrivals, delivery completion verification, and return-to-base triggers.
 * 
 * @module App
 * @author Thesis Research Team
 */

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

// Application view components
import CustomerHome from "./pages/CustomerHome";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import KitchenDisplay from "./pages/KDS/KitchenDisplay";
import AdminLogin from "./pages/Admin/AdminLogin";
import RobotAccess from "./pages/Waiter/RobotAccess";
import RobotTracker from "./pages/Waiter/RobotTracker";

/**
 * Higher-Order Component implementing client-side route authorization for admin portals.
 * Redirects unauthenticated visitors to `/admin/login`.
 * 
 * @param {{children: React.ReactNode}} props - Component props containing child route
 * @returns {React.ReactElement} Authorized child view or redirect to login
 */
const ProtectedRoute = ({ children }) => {
  const isAuth = localStorage.getItem("viva_admin_session") === "true";

  if (!isAuth) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

/**
 * Root Application Component configuring client-side routing via React Router v7.
 * 
 * @returns {React.ReactElement} Configured router element tree
 */
export default function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <Routes>
        {/* Customer Self-Service Ordering & Tracking Portal */}
        <Route path="/" element={<CustomerHome />} />

        {/* Administrator Authentication Portal */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Administrator Dashboard & Operations Management */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Kitchen Display System (KDS) for Chefs and Robot Dispatching */}
        <Route path="/kds" element={<KitchenDisplay />} />

        {/* Waitstaff Robot Fleet Overview & Station Telemetry */}
        <Route path="/robot" element={<RobotAccess />} />
        <Route path="/robot/:id" element={<RobotTracker />} />

        {/* Fallback Wildcard: Redirect unmapped URIs to Customer Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

