/**
 * @file MenuGrid.jsx
 * @description Responsive Layout Grid for Catalog Dish Cards.
 * 
 * Thesis Context:
 * Organizes menu item cards in a multi-column responsive grid adapted for desktop
 * and tablet administration workstations.
 * 
 * @module pages/Admin/components/MenuGrid
 * @author Thesis Research Team
 */

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
