import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

// Importing our new page components
import CustomerHome from "./pages/CustomerHome";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import KitchenDisplay from "./pages/KDS/KitchenDisplay";
import AdminLogin from "./pages/Admin/AdminLogin";
import RobotAccess from "./pages/Waiter/RobotAccess";
import RobotTracker from "./pages/Waiter/RobotTracker";

const ProtectedRoute = ({ children }) => {
  const isAuth = localStorage.getItem("viva_admin_session") === "true";

  if (!isAuth) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <Routes>
        {/* Main Customer Site */}
        <Route path="/" element={<CustomerHome />} />

        {/* Admin Login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin Dashboard to manage menu/prices */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* KDS for the kitchen and Robot tracking */}
        <Route path="/kds" element={<KitchenDisplay />} />

        {/* Robot Tracking for Waiters */}
        <Route path="/robot" element={<RobotAccess />} />
        <Route path="/robot/:id" element={<RobotTracker />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
