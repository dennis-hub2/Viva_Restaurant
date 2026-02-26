import React, { useState } from "react";
import MenuGrid from "../components/MenuGrid";
import EditItemModal from "../components/EditItemModel";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

const MenuManagement = () => {
  // 1. Menu Items State
  const [items, setItems] = useState([
    {
      id: 1,
      name: "Wagyu Burger",
      price: 24.0,
      category: "Burgers",
      icon: "🍔",
      popular: true,
      desc: "Premium wagyu beef with truffle aioli.",
    },
    {
      id: 2,
      name: "Truffle Pasta",
      price: 18.5,
      category: "Pasta",
      icon: "🍝",
      popular: false,
      desc: "Fresh handmade pasta with seasonal truffles.",
    },
    {
      id: 3,
      name: "Salmon Sushi",
      price: 22.0,
      category: "Sushi",
      icon: "🍣",
      popular: true,
      desc: "Fresh Atlantic salmon with premium sushi rice.",
    },
    {
      id: 4,
      name: "Garden Salad",
      price: 12.0,
      category: "Salads",
      icon: "🥗",
      popular: false,
      desc: "Organic greens with balsamic vinaigrette.",
    },
    {
      id: 5,
      name: "Ribeye Steak",
      price: 45.0,
      category: "Steaks",
      icon: "🥩",
      popular: true,
      desc: "Dry-aged 12oz ribeye steak.",
    },
    {
      id: 6,
      name: "Margherita Pizza",
      price: 15.0,
      category: "Pizza",
      icon: "🍕",
      popular: false,
      desc: "Classic mozzarella and fresh basil.",
    },
    {
      id: 7,
      name: "Iced Caramel",
      price: 6.5,
      category: "Drinks",
      icon: "☕",
      popular: false,
      desc: "Cold brew coffee with house-made caramel.",
    },
    {
      id: 8,
      name: "Lava Cake",
      price: 9.0,
      category: "Desserts",
      icon: "🍰",
      popular: true,
      desc: "Dark chocolate fondant with molten center.",
    },
  ]);

  // 2. Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // 3. Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // --- Handlers for Editing ---
  const handleEditTrigger = (item) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (updatedItem) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === updatedItem.id ? updatedItem : item,
      ),
    );
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  // --- Handlers for Deletion ---
  const handleDeleteTrigger = (id) => {
    const item = items.find((i) => i.id === id);
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    setItems((prev) => prev.filter((item) => item.id !== itemToDelete.id));
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  return (
    <div className="w-full">
      {/* Header Section */}
      <header className="flex justify-between items-end mb-10">
        <div className="text-left">
          <h2 className="text-4xl font-black text-white tracking-tight">
            Menu Management
          </h2>
          <p className="text-gray-400 font-medium mt-1">
            {items.length} items ·{" "}
            <span className="text-green-400">Live menu</span>
          </p>
        </div>

        <button
          className="bg-[#6539A3] hover:bg-[#7a4bc0] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-purple-900/40 transition-all active:scale-95 flex items-center gap-2"
          onClick={() => console.log("Open Add Item Modal")}
        >
          <span className="text-xl leading-none">+</span> Add Item
        </button>
      </header>

      {/* Grid Content */}
      <MenuGrid
        items={items}
        onEdit={handleEditTrigger}
        onDelete={handleDeleteTrigger}
      />

      {/* Edit Modal Component */}
      {selectedItem && (
        <EditItemModal
          key={selectedItem.id} // Forces re-mount to avoid useEffect errors
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          item={selectedItem}
          onSave={handleSaveEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        itemName={itemToDelete?.name}
      />
    </div>
  );
};

export default MenuManagement;
