import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Importing our new page components
import CustomerHome from "./pages/CustomerHome";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import KitchenDisplay from "./pages/KDS/KitchenDisplay";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Main Customer Site */}
        <Route path="/" element={<CustomerHome />} />

        {/* Admin Dashboard to manage menu/prices */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* KDS for the kitchen and Robot tracking */}
        <Route path="/kds" element={<KitchenDisplay />} />
      </Routes>
    </Router>
  );
}
