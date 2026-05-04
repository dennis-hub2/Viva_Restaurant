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
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10">
        <div className="text-left border-l-8 border-red-600 pl-8">
          <h2 className="text-5xl font-black text-gray-900 mb-2 tracking-tighter uppercase italic">
            Menu
          </h2>
          <p className="text-gray-500 text-xs font-black uppercase tracking-[0.3em]">
            {isLoading ? "Syncing..." : `${items.length} Items Listed • Live`}
          </p>
        </div>

        <button
          className="bg-[#6539A3] text-white px-5 py-2.5 sm:px-8 sm:py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-[0px_4px_0px_#4B1E83] hover:translate-y-[1px] hover:shadow-[0px_3px_0px_#4B1E83] transition-all active:translate-y-[4px] active:shadow-none flex items-center gap-2 mb-2"
          onClick={() => setIsAddModalOpen(true)}
        >
          <span className="text-lg sm:text-xl leading-none">+</span> Add New
          Dish
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
