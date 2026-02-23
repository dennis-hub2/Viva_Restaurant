import React, { useState } from "react";
import Navbar from "./Components/navbar";
import Hero from "./Components/Hero";
// import TopPicks from "./Components/TopPicks";
import DecorativeSection from "./Components/DecorativeSection";
import CategoryTabs from "./Components/CategoryTabs";
import MenuCard from "./Components/MenuCard";
import { menuData } from "./data/menuData";
import CartDrawer from "./Components/CartDrawer";

export default function App() {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Handles adding new items from the Menu Cards
  const handleAddToCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });

    setToastMessage(`Added ${item.name} to cart! 🛒`);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  // Centralized handler for + and - buttons in the drawer
  const handleUpdateQuantity = (id, amount) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + amount) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  // UPDATED: Simplified for custom drawer confirmation
  const handleClearCart = () => {
    setCart([]);
  };

  const filteredMenu = menuData.filter((item) => {
    const matchesCategory = activeTab === "All" || item.category === activeTab;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FAF1E4] px-6 md:px-12 lg:px-20 pb-20 font-sans relative">
      <div className="max-w-7xl mx-auto">
        <Navbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          cartItemCount={cart.reduce((total, item) => total + item.quantity, 0)}
          onOpenCart={() => setIsCartOpen(true)}
        />

        <main className="flex flex-col lg:flex-row w-full mt-4 min-h-[85vh] lg:items-center">
          <div className="flex-1 z-10">
            <Hero />
          </div>
          <div className="flex-1 z-0">
            <DecorativeSection />
          </div>
        </main>

        <section
          className="scroll-mt-24 mt-32 pt-10 border-t border-[#332a2415]"
          id="menu"
        >
          <div className="mb-10">
            <h2 className="text-5xl md:text-6xl font-black text-[#332A24] font-['Fredoka',_sans-serif] tracking-tight mb-4">
              Our Menu
            </h2>
            <p className="text-gray-600 text-[17px] max-w-xl leading-relaxed">
              Handcrafted dishes by our world-class culinary team
            </p>
          </div>

          <CategoryTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {filteredMenu.length === 0 ? (
            <div className="text-center py-20 text-gray-500 font-bold text-lg">
              No dishes found for "{searchQuery}". Try another search!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mt-4 min-h-[50vh] content-start">
              {filteredMenu.map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onRemoveItem={(id) => handleUpdateQuantity(id, -1)}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
      />

      {toastMessage && (
        <div className="fixed bottom-10 right-6 sm:right-10 bg-[#332A24] text-white px-6 py-4 rounded-2xl shadow-2xl font-bold z-[100] flex items-center gap-3 animate-bounce">
          <span className="bg-[#7C903E] h-2 w-2 rounded-full"></span>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
