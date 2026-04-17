import React, { useState, useEffect } from "react";
import MenuGrid from "../components/MenuGrid";
import EditItemModal from "../components/EditItemModel";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import AddItemModal from "../components/AddItemModal";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../../firebase";

const MenuManagement = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Live Listener with Sorting ---
  useEffect(() => {
    const menuCollectionRef = collection(db, "menuItems");

    const unsubscribe = onSnapshot(menuCollectionRef, (snapshot) => {
      const liveData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // A-Z Sorting
      const sortedData = liveData.sort((a, b) => {
        const nameA = a.name?.toLowerCase() || "";
        const nameB = b.name?.toLowerCase() || "";
        return nameA.localeCompare(nameB);
      });

      setItems(sortedData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // --- Handlers for Adding (Now includes auto-rating) ---
  const handleAddItem = async (newItem) => {
    try {
      const menuCollectionRef = collection(db, "menuItems");

      // We automatically add the rating here so Firestore stays consistent
      const itemToSave = {
        ...newItem,
        rating: 5.0,
        createdAt: new Date(),
      };

      await addDoc(menuCollectionRef, itemToSave);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to save item.");
    }
  };

  const handleEditTrigger = (item) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedItem) => {
    try {
      const itemDocRef = doc(db, "menuItems", updatedItem.id);
      const { id, ...dataToUpdate } = updatedItem;
      await updateDoc(itemDocRef, dataToUpdate);
      setIsEditModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error("Error updating: ", error);
    }
  };

  const handleDeleteTrigger = (id) => {
    const item = items.find((i) => i.id === id);
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const itemDocRef = doc(db, "menuItems", itemToDelete.id);
      await deleteDoc(itemDocRef);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting: ", error);
    }
  };

  return (
    <div className="w-full">
      <header className="flex justify-between items-end mb-10">
        <div className="text-left">
          <h2 className="text-4xl font-black text-white tracking-tight">
            Menu Management
          </h2>
          <p className="text-gray-400 font-medium mt-1">
            {isLoading ? "Loading..." : `${items.length} items · `}
            <span className="text-green-400">Live menu</span>
          </p>
        </div>

        <button
          className="bg-[#6539A3] hover:bg-[#7a4bc0] text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95"
          onClick={() => setIsAddModalOpen(true)}
        >
          <span className="text-xl leading-none">+</span> Add Item
        </button>
      </header>

      {isLoading ? (
        <div className="text-white text-center py-20 animate-pulse">
          Syncing with database...
        </div>
      ) : (
        <MenuGrid
          items={items}
          onEdit={handleEditTrigger}
          onDelete={handleDeleteTrigger}
        />
      )}

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddItem}
      />

      {selectedItem && (
        <EditItemModal
          key={selectedItem.id}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          item={selectedItem}
          onSave={handleSaveEdit}
        />
      )}

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
