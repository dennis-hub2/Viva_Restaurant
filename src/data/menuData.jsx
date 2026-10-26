/**
 * @file menuData.jsx
 * @description Static Fallback Menu Catalog and Culinary Classification Schema.
 * 
 * Thesis Context:
 * Serves as the offline fallback data fixture and initial seed schema for restaurant
 * dining catalog items. When Firestore connectivity is initialized, live items are
 * queried dynamically, but this schema defines the structural contract for dish properties:
 * name, description, price, rating, preparation latency, popularity flag, category, and asset URI.
 * 
 * @module data/menuData
 * @author Thesis Research Team
 */

/**
 * Standard culinary categories supported across the ordering interface.
 * @type {string[]}
 */
export const categories = [
  "All",
  "Burgers",
  "Pasta",
  "Sushi",
  "Ramen",
  "Soups",
  "Mains",
  "Starters",
  "Desserts",
];

/**
 * Baseline catalog records utilized for development, offline testing, and initial database seeding.
 * @type {Array<{id: number, name: string, desc: string, price: number, rating: number, time: string, popular: boolean, image: string, category: string}>}
 */
export const menuData = [
  {
    id: 1,
    name: "Wagyu Burger",
    desc: "A5 wagyu patty, truffle aioli, aged cheddar, brioche",
    price: 24.99,
    rating: 4.9,
    time: "12 min",
    popular: true,
    image: "/food-placeholder.svg",
    category: "Burgers",
  },
  {
    id: 2,
    name: "Truffle Pasta",
    desc: "Hand-rolled fettuccine, black truffle, parmesan cream",
    price: 22.5,
    rating: 4.8,
    time: "18 min",
    popular: true,
    image: "/food-placeholder.svg",
    category: "Pasta",
  },
  {
    id: 3,
    name: "Dragon Roll",
    desc: "Spicy tuna, avocado, cucumber, sriracha drizzle",
    price: 18.99,
    rating: 4.7,
    time: "10 min",
    popular: false,
    image: "/food-placeholder.svg",
    category: "Sushi",
  },
  {
    id: 4,
    name: "Miso Ramen",
    desc: "Rich miso broth, chashu pork, soft egg, bamboo shoots",
    price: 19.5,
    rating: 4.9,
    time: "15 min",
    popular: false,
    image: "/food-placeholder.svg",
    category: "Ramen",
  },
  {
    id: 5,
    name: "Lobster Bisque",
    desc: "Creamy Maine lobster bisque, cognac cream, chives",
    price: 16.99,
    rating: 4.6,
    time: "8 min",
    popular: false,
    image: "/food-placeholder.svg",
    category: "Soups",
  },
  {
    id: 6,
    name: "Crispy Duck Confit",
    desc: "Slow-cooked duck leg, cherry jus, pommes puree",
    price: 29.99,
    rating: 4.8,
    time: "20 min",
    popular: true,
    image: "/food-placeholder.svg",
    category: "Mains",
  },
  {
    id: 7,
    name: "Tuna Tartare",
    desc: "Ahi tuna, avocado, sesame, citrus ponzu",
    price: 21.0,
    rating: 4.7,
    time: "8 min",
    popular: false,
    image: "/food-placeholder.svg",
    category: "Starters",
  },
  {
    id: 8,
    name: "Matcha Lava Cake",
    desc: "Warm matcha cake, vanilla ice cream, red bean",
    price: 12.99,
    rating: 4.9,
    time: "12 min",
    popular: true,
    image: "/food-placeholder.svg",
    category: "Desserts",
  },
];
