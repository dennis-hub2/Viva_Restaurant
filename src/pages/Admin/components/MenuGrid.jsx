// src/pages/Admin/components/MenuGrid.jsx
import React from "react";
import MenuCard from "./MenuCard";

const MenuGrid = ({ items, onEdit, onDelete }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {items.map((item) => (
      <MenuCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
    ))}
  </div>
);

export default MenuGrid;
