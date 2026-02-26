import React, { useState, useEffect } from "react";
import Navbar from "../Components/navbar";
import Hero from "../Components/Hero";
import DecorativeSection from "../Components/DecorativeSection";
import CategoryTabs from "../Components/CategoryTabs";
import MenuCard from "../Components/MenuCard";
import CartDrawer from "../Components/CartDrawer";
import { menuData } from "../data/menuData";

const CustomerHome = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // 1. Lazy Initialize the cart from LocalStorage
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("foodie_cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // 2. Sync the cart to LocalStorage EVERY time the cart array changes
  useEffect(() => {
    localStorage.setItem("foodie_cart", JSON.stringify(cart));
  }, [cart]);

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
    setTimeout(() => setToastMessage(""), 3000);
  };

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

  // --- NEW: Checkout Logic ---
  const handleCheckout = (tableNumber) => {
    // 1. Fetch existing KDS orders (or start with an empty array)
    const existingKdsOrders =
      JSON.parse(localStorage.getItem("kds_orders")) || [];

    // 2. Format the new order to match your KDS structure
    const newOrder = {
      id: Math.floor(1000 + Math.random() * 9000).toString(), // Random 4-digit ID
      table: Number(tableNumber),
      status: "new",
      timeElapsed: "0m",
      items: cart.map((item) => ({
        qty: item.quantity,
        name: item.name,
      })),
    };

    // 3. Save the updated orders list back to LocalStorage
    localStorage.setItem(
      "kds_orders",
      JSON.stringify([...existingKdsOrders, newOrder]),
    );

    // 4. Clear the cart and close the drawer
    setCart([]);
    setIsCartOpen(false);

    // 5. Show a success message to the customer
    setToastMessage(
      `Order #${newOrder.id} completed for Table ${tableNumber}! 🤖`,
    );
    setTimeout(() => setToastMessage(""), 4000);
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
          <h2 className="text-5xl md:text-6xl font-black text-[#332A24] font-['Fredoka',_sans-serif] mb-4">
            Our Menu
          </h2>
          <CategoryTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mt-4">
            {filteredMenu.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </section>
      </div>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onRemoveItem={(id) => handleUpdateQuantity(id, -1)}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={() => setCart([])}
        onCheckout={handleCheckout} // <--- ADDED NEW PROP HERE
      />

      {toastMessage && (
        <div className="fixed bottom-10 right-6 bg-[#332A24] text-white px-6 py-4 rounded-2xl shadow-2xl z-[100] animate-bounce">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default CustomerHome;
