/**
 * @file firebase.js
 * @description Firebase SDK Initialization and Hardware-in-the-Loop Simulation Suite.
 * 
 * Thesis Context:
 * Viva Restaurant utilizes a hybrid Cloud-Edge architecture:
 * 1. Cloud Firestore: Scalable document store managing transactional business data,
 *    including catalog menus, live customer orders, staff access records, and historical sales analytics.
 * 2. Realtime Database (RTDB): Low-latency WebSocket data stream dedicated to edge telemetry,
 *    sub-second state synchronization with the ESP32 microcontroller ('swagbot1'), and waiter live tracking.
 * 3. Firebase Authentication: Role-based identity management for kitchen staff and administrators.
 * 4. Simulation Engine (`window.simulator`): Developer console test harness allowing comprehensive
 *    validation and demonstration of the complete order-to-delivery lifecycle without requiring
 *    physical robotics hardware connected during academic evaluation.
 * 
 * @module firebase
 * @author Thesis Research Team
 */

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, update } from "firebase/database";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { get } from "firebase/database";

/**
 * Firebase Client Configuration Object loaded from Vite environment variables.
 * @constant {Object}
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize the primary Firebase Application instance
const app = initializeApp(firebaseConfig);

/**
 * Cloud Firestore instance for transactional data (Orders, Menus, Analytics, Users).
 * @type {import('firebase/firestore').Firestore}
 */
export const db = getFirestore(app);

/**
 * Firebase Authentication instance for secure role-based access.
 * @type {import('firebase/auth').Auth}
 */
export const auth = getAuth(app);

/**
 * Firebase Realtime Database instance for low-latency robot telemetry.
 * @type {import('firebase/database').Database}
 */
export const rtdb = getDatabase(app);

// Export RTDB utility references for modular consumption
export { ref, update };

// ============================================================================
// SIMULATION HARNESS FOR THESIS EVALUATION & DEMONSTRATIONS (F12 CONSOLE)
// ============================================================================

/**
 * Hardware-in-the-Loop Simulation Harness exposed globally on `window.simulator`.
 * Allows academic reviewers and testers to emulate physical robot progression
 * and multi-agent state synchronization from the browser developer console.
 */
window.simulator = {
  /**
   * Prints the interactive guide and list of available simulation methods to the browser console.
   */
  help: () => {
    console.log("%c--- ROBOT WORKFLOW SIMULATOR (THESIS SUITE) ---", "color: #6539A3; font-weight: bold; font-size: 14px;");
    console.log("Run the following commands in the console to simulate the robotic delivery lifecycle:");
    console.log("1. simulator.createReadyOrder(X)  - Creates a synthetic ready order in Firestore for table number X (e.g. 1).");
    console.log("2. simulator.robotArrive(X)       - Emulates ESP32 IR sensor trip: robot arrives at table X in RTDB.");
    console.log("3. simulator.waiterConfirm(X)     - Emulates waiter/customer delivery confirmation at table X.");
    console.log("4. simulator.robotDock()          - Emulates robot docking completion, resetting state to idle.");
  },

  /**
   * Generates a mock order with status 'ready' in Cloud Firestore for a specified dining table.
   * 
   * @param {number|string} tableNumber - Table number to generate the order for (1-4)
   * @returns {Promise<void>}
   */
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

  /**
   * Emulates the physical ESP32 robot triggering the IR marker at a target table station.
   * Updates RTDB telemetry: `current_location`, `trip_status: "waiting_confirmation"`, and `tableX/arrived: true`.
   * 
   * @param {number|string} tableNumber - Destination table number (1-4)
   * @returns {Promise<void>}
   */
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

  /**
   * Emulates customer or waitstaff confirming meal receipt at the designated table station.
   * If the current table is the final stop in the active route, initiates automatic return-to-base (`home: true`).
   * Otherwise, transitions status to `en_route` towards subsequent stations.
   * 
   * @param {number|string} tableNumber - Station table number (1-4)
   * @returns {Promise<void>}
   */
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

  /**
   * Emulates the physical ESP32 returning to the docking base station.
   * Resets all table mission flags, clears active routes, and restores `trip_status` to `"idle"`.
   * 
   * @returns {Promise<void>}
   */
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

// Announce simulation harness availability in the developer console after initialization
setTimeout(() => {
  window.simulator.help();
}, 2000);

