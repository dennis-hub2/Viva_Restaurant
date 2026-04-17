import React, { useState, useEffect } from "react";
import Navbar from "../Components/navbar";
import Hero from "../Components/Hero";
import DecorativeSection from "../Components/DecorativeSection";
import CategoryTabs from "../Components/CategoryTabs";
import MenuCard from "../Components/MenuCard";
import CartDrawer from "../Components/CartDrawer";
import ContactSection from "../Components/ContactSection";

// 1. NEW: Firebase imports (We deleted the local menuData import!)
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "../firebase"; // ⚠️ IMPORTANT: Verify this path points to your firebase config file!

const CustomerHome = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // 2. NEW: State to hold the live database menu
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- The Live Firebase Listener ---
  useEffect(() => {
    const menuCollectionRef = collection(db, "menuItems");

    // Listen to the database and update the screen instantly
    const unsubscribe = onSnapshot(menuCollectionRef, (snapshot) => {
      const liveData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMenuItems(liveData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- Cart & Checkout Logic (Untouched!) ---
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("foodie_cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

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

  const handleCheckout = async (tableNumber) => {
    if (!tableNumber) return;

    try {
      const ordersCollectionRef = collection(db, "orders");
      
      const newOrder = {
        table: Number(tableNumber),
        status: "new",
        createdAt: new Date(),
        items: cart.map((item) => ({
          qty: item.quantity,
          name: item.name,
          price: item.price,
          emoji: item.emoji || item.icon || "🍽️"
        })),
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      };

      await addDoc(ordersCollectionRef, newOrder);

      setCart([]);
      setIsCartOpen(false);

      setToastMessage(
        `Order placed successfully for Table ${tableNumber}! 🤖`
      );
      setTimeout(() => setToastMessage(""), 4000);
    } catch (error) {
      console.error("Error placing order:", error);
      setToastMessage("Failed to place order. Please try again.");
    }
  };

  // 3. UPDATED: Filtering logic now points to our live `menuItems` state
  const filteredMenu = menuItems.filter((item) => {
    const matchesCategory = activeTab === "All" || item.category === activeTab;
    const matchesSearch =
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // --- The Live Firebase Listener with Alphabetical Sorting ---
  useEffect(() => {
    const menuCollectionRef = collection(db, "menuItems");

    const unsubscribe = onSnapshot(menuCollectionRef, (snapshot) => {
      const liveData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // --- Sort A-Z by Name ---
      const sortedData = liveData.sort((a, b) => {
        const nameA = a.name?.toLowerCase() || "";
        const nameB = b.name?.toLowerCase() || "";

        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      });

      setMenuItems(sortedData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

          {/* NEW: Mobile Food Menu button placed below the animated image on small screens */}
          <div className="lg:hidden w-full flex justify-center mt-12 pb-10">
            <a
              href="#menu"
              className="inline-block bg-[#DE6555] text-white font-bold text-lg py-4 px-10 rounded-full shadow-[0px_6px_0px_#A54538] hover:translate-y-[2px] hover:shadow-[0px_4px_0px_#A54538] transition-all active:translate-y-[6px] active:shadow-none"
            >
              Food Menu
            </a>
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

          {/* 4. NEW: Added a clean loading state so the page doesn't look broken while fetching */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <p className="text-xl font-bold text-[#332A24] animate-pulse">
                Fetching fresh dishes from the kitchen...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mt-4">
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

        <ContactSection />
      </div>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onRemoveItem={(id) => handleUpdateQuantity(id, -1)}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={() => setCart([])}
        onCheckout={handleCheckout}
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
