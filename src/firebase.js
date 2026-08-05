// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // For your menu database
import { getAuth } from "firebase/auth"; // For admin login
import { getDatabase, ref, update } from "firebase/database"; // NEW: For live robot telemetry

// Pulling your keys safely from the .env file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services and export them so other files can use them
export const db = getFirestore(app);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);
export { ref, update }; // NEW: Export RTDB utilities

// --- SIMULATION HELPER FOR F12 DEVELOPER CONSOLE ---
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { get } from "firebase/database";

window.simulator = {
  help: () => {
    console.log("%c--- ROBOT WORKFLOW SIMULATOR ---", "color: #6539A3; font-weight: bold; font-size: 14px;");
    console.log("Run the following commands to simulate the delivery lifecycle:");
    console.log("1. simulator.createReadyOrder(X)  - Creates a new ready order in Firestore for table number X.");
    console.log("2. simulator.robotArrive(X)       - Simulates the robot arriving at table number X (RTDB updates).");
    console.log("3. simulator.waiterConfirm(X)     - Simulates confirming the delivery at table number X.");
    console.log("4. simulator.robotDock()          - Simulates the robot returning to docking and resetting to idle.");
  },

  createReadyOrder: async (tableNumber) => {
    const tableStr = `table${tableNumber}`;
    console.log(`[Simulator] Creating ready order for Table ${tableNumber}...`);
    try {
      const docRef = await addDoc(collection(db, "orders"), {
        table: tableNumber,
        tableName: tableStr,
        status: "ready",
        createdAt: serverTimestamp(),
        items: [
          { name: "Simulation Burger", qty: 1, price: 10.00 },
          { name: "Simulation Soda", qty: 1, price: 2.50 }
        ],
        type: "Dine In"
      });
      console.log(`[Simulator] Order created in Firestore. ID: ${docRef.id}`);
    } catch (e) {
      console.error("[Simulator] Firestore order creation failed:", e);
    }
  },

  robotArrive: async (tableNumber) => {
    const tableName = `table${tableNumber}`;
    console.log(`[Simulator] Simulating robot arrival at ${tableName}...`);
    try {
      const robotRef = ref(rtdb, "swagbot1");
      await update(robotRef, {
        current_location: tableName,
        trip_status: "waiting_confirmation",
        [`${tableName}/arrived`]: true
      });
      console.log(`[Simulator] Robot arrived at ${tableName}. Status: waiting_confirmation.`);
    } catch (e) {
      console.error("[Simulator] Arrival update failed:", e);
    }
  },

  waiterConfirm: async (tableNumber) => {
    const tableName = `table${tableNumber}`;
    console.log(`[Simulator] Simulating waiter confirmation for ${tableName}...`);
    try {
      const robotRef = ref(rtdb, "swagbot1");
      const snap = await get(robotRef);
      const robot = snap.val() || {};
      const route = robot.route || [];
      const isLast = route.length > 0 && route[route.length - 1] === tableName;

      const updates = {
        [`${tableName}/confirmed`]: true,
        [`${tableName}/status`]: true
      };

      if (isLast) {
        updates.home = true;
        updates.trip_status = "returning";
        console.log("[Simulator] Last stop! Robot is automatically returning home.");
      } else {
        updates.trip_status = "en_route";
        console.log("[Simulator] Intermediate stop. Robot heading to next destination.");
      }

      await update(robotRef, updates);
      console.log("[Simulator] Delivery confirmed in RTDB.");
    } catch (e) {
      console.error("[Simulator] Confirmation update failed:", e);
    }
  },

  robotDock: async () => {
    console.log("[Simulator] Simulating robot returning to docking...");
    try {
      const robotRef = ref(rtdb, "swagbot1");
      const snap = await get(robotRef);
      const robot = snap.val() || {};
      const route = robot.route || [];

      const updates = {};
      route.forEach((tableName) => {
        updates[`${tableName}/mission`] = "idle";
        updates[`${tableName}/status`] = false;
        updates[`${tableName}/arrived`] = false;
        updates[`${tableName}/confirmed`] = false;
      });

      updates.trip_status = "idle";
      updates.move = false;
      updates.home = false;
      updates.current_location = "docking";
      updates.route = null;

      await update(robotRef, updates);
      console.log("[Simulator] Robot docked. RTDB state reset to idle.");
    } catch (e) {
      console.error("[Simulator] Docking update failed:", e);
    }
  }
};

// Log simulator availability
setTimeout(() => {
  window.simulator.help();
}, 2000);

