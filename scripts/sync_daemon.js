/**
 * @file sync_daemon.js
 * @description Standalone Node.js Synchronization Daemon for Headless Operation.
 * 
 * Thesis Context:
 * In edge server and kiosk deployments where no continuous browser session is maintained,
 * this standalone background process connects via Firebase Admin SDK to provide:
 * 1. Continuous bidirectional event synchronization between Cloud Firestore orders and RTDB robot telemetry.
 * 2. Automated ticket completion transitions upon table delivery confirmation.
 * 3. Health monitoring and heartbeat logging for fault diagnosis.
 * 
 * @module scripts/sync_daemon
 * @author Thesis Research Team
 */

import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROBOT_ID = "swagbot1";
const TABLES = ["table1", "table2", "table3", "table4"];

// Load environment variables from the root .env file if available
function loadEnv() {
  const envPath = path.join(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    console.log(`[Config] Loading variables from root .env file: ${envPath}`);
    const content = fs.readFileSync(envPath, "utf8");
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const match = trimmed.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

// Find and load service account credentials JSON file
let serviceAccount = null;
const possibleKeyPaths = [
  path.join(__dirname, "serviceAccountKey.json"),
  path.join(__dirname, "../serviceAccountKey.json"),
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
].filter(Boolean);

for (const keyPath of possibleKeyPaths) {
  if (fs.existsSync(keyPath)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
      console.log(`[Config] Loaded Firebase Service Account credentials from: ${keyPath}`);
      break;
    } catch (e) {
      console.error(`[Config] Failed to parse key file at ${keyPath}:`, e.message);
    }
  }
}

if (!serviceAccount) {
  console.error("\n[Error] Firebase Service Account credentials not found!");
  console.error("Please generate a Service Account private key JSON file from the Firebase Console:");
  console.error("  1. Project Settings -> Service Accounts");
  console.error("  2. Click 'Generate new private key'");
  console.error(`  3. Save it as 'serviceAccountKey.json' in: ${__dirname}\n`);
  process.exit(1);
}

// Determine database URL
const databaseURL =
  process.env.FIREBASE_DATABASE_URL ||
  process.env.VITE_FIREBASE_DATABASE_URL ||
  (process.env.VITE_FIREBASE_PROJECT_ID
    ? `https://${process.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`
    : serviceAccount.project_id
      ? `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com/`
      : null);

if (!databaseURL) {
  console.error("[Error] Realtime Database URL could not be determined. Please specify it in your .env or as FIREBASE_DATABASE_URL env variable.");
  process.exit(1);
}

console.log(`[Config] Database URL determined as: ${databaseURL}`);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: databaseURL,
});

const firestore = admin.firestore();
const rtdb = admin.database();

function tableState() {
  return {
    mission: "idle",
    status: false,
    arrived: false,
    confirmed: false,
  };
}

function buildIdleRobotState() {
  return {
    current_location: "docking",
    home: false,
    move: false,
    route: [],
    trip_status: "docking",
    table1: tableState(),
    table2: tableState(),
    table3: tableState(),
    table4: tableState(),
  };
}

function getOrderTableName(order = {}) {
  const rawTable = order.tableName || order.table || order.tableNumber;
  if (rawTable == null) return null;

  const match = String(rawTable).trim().toLowerCase().match(/(\d+)/);
  if (!match) return null;

  const tableName = `table${match[1]}`;
  return TABLES.includes(tableName) ? tableName : null;
}

function sortRoute(route) {
  return [...new Set(route)].sort(
    (left, right) => TABLES.indexOf(left) - TABLES.indexOf(right),
  );
}

function expandRoute(route) {
  if (!route || route.length === 0) return [];
  let maxIndex = -1;
  route.forEach((tbl) => {
    const idx = TABLES.indexOf(tbl);
    if (idx > maxIndex) {
      maxIndex = idx;
    }
  });
  if (maxIndex === -1) return [];
  return TABLES.slice(0, maxIndex + 1);
}

function normalizeRouteValue(route) {
  const routeValues = Array.isArray(route)
    ? route
    : route && typeof route === "object"
      ? Object.entries(route)
          .sort(([leftKey], [rightKey]) => Number(leftKey) - Number(rightKey))
          .map(([, value]) => value)
      : [];

  return sortRoute(
    routeValues
      .map((value) => String(value).trim().toLowerCase())
      .filter((value) => TABLES.includes(value)),
  );
}

function canStartTrip(robot = {}) {
  const status = robot.trip_status || "docking";
  return (
    robot.move !== true &&
    (status === "docking" || status === "idle") &&
    robot.home !== true
  );
}

function buildTripState(currentRobot = {}, route = [], targets = []) {
  const nextRobot = {
    ...buildIdleRobotState(),
    ...currentRobot,
    move: true,
    route,
    trip_status: "en_route",
  };

  for (const tableName of TABLES) {
    if (targets.includes(tableName)) {
      nextRobot[tableName] = {
        mission: "destination",
        status: false,
        arrived: false,
        confirmed: false,
      };
    } else {
      nextRobot[tableName] = tableState();
    }
  }

  return nextRobot;
}

let isDispatching = false;

async function dispatchReadyOrdersIfPossible() {
  if (isDispatching) return;
  isDispatching = true;

  const robotRef = rtdb.ref(ROBOT_ID);

  try {
    const [readyOrdersSnapshot, robotSnapshot] = await Promise.all([
      firestore.collection("orders").where("status", "==", "ready").get(),
      robotRef.get(),
    ]);

    const robot = robotSnapshot.val() || buildIdleRobotState();
    if (!canStartTrip(robot)) {
      console.log(`[Dispatch] Robot ${ROBOT_ID} is busy or has an active route. Ready orders remain queued.`);
      isDispatching = false;
      return;
    }

    const dispatchableOrders = readyOrdersSnapshot.docs.filter((doc) => {
      const data = doc.data();
      return !data.assignedRobot && getOrderTableName(data);
    });

    const targets = sortRoute(
      dispatchableOrders
        .map((doc) => getOrderTableName(doc.data()))
        .filter(Boolean)
    );
    const activeTargets = targets.slice(0, 2);
    const route = expandRoute(activeTargets);

    if (route.length === 0) {
      console.log("[Dispatch] No dispatchable orders found with valid tables.");
      isDispatching = false;
      return;
    }

    console.log(`[Dispatch] Attempting dispatch transaction for route: ${route.join(" -> ")}`);

    const transactionResult = await robotRef.transaction((current) => {
      const currentRobot = current || buildIdleRobotState();
      if (!canStartTrip(currentRobot)) {
        return undefined; // Abort transaction
      }
      return buildTripState(currentRobot, route, activeTargets);
    });

    if (!transactionResult.committed) {
      console.log(`[Dispatch] Robot transaction aborted: ${ROBOT_ID} was claimed by another process.`);
      isDispatching = false;
      return;
    }

    console.log("[Dispatch] RTDB updated successfully. Assigning orders in Firestore...");

    const ordersToAssign = dispatchableOrders.filter((doc) => {
      return activeTargets.includes(getOrderTableName(doc.data()));
    });

    const batch = firestore.batch();
    ordersToAssign.forEach((doc) => {
      batch.update(doc.ref, {
        assignedRobot: ROBOT_ID,
        dispatchedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();

    console.log(`[Dispatch] Successfully started trip for ${ROBOT_ID} with route [${route.join(", ")}]`);
  } catch (error) {
    console.error("[Dispatch] Error during order dispatch sequence:", error);
  } finally {
    isDispatching = false;
  }
}

// ----------------------------------------------------
// Listeners setup
// ----------------------------------------------------

console.log("\n[Daemon] Starting listeners...");

// Note: Auto-dispatch listeners disabled. Robot assignment is strictly manual from KDS UI.
console.log("[Daemon] Running in Manual Dispatch Mode (table confirmation sync only).");

// Listener 3: RTDB Table confirmations (marks Firestore orders as completed)
TABLES.forEach((tableName) => {
  rtdb.ref(`${ROBOT_ID}/${tableName}/confirmed`).on(
    "value",
    async (snapshot) => {
      const confirmed = snapshot.val();
      if (confirmed === true) {
        console.log(`[Listener] RTDB: Table ${tableName} confirmed. Syncing to Firestore...`);
        try {
          const snap = await firestore.collection("orders")
            .where("status", "==", "ready")
            .where("assignedRobot", "==", ROBOT_ID)
            .get();
          
          const batch = firestore.batch();
          let count = 0;
          
          snap.docs.forEach((docSnap) => {
            const data = docSnap.data();
            if (getOrderTableName(data) === tableName) {
              batch.update(docSnap.ref, {
                status: "completed",
                completedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
              count++;
            }
          });
          
          if (count > 0) {
            await batch.commit();
            console.log(`[Listener] Marked ${count} orders for ${tableName} as completed in Firestore.`);
          }
        } catch (error) {
          console.error(`[Listener Error] Failed to update orders for ${tableName} to completed:`, error);
        }
      }
    },
    (error) => {
      console.error(`[Listener Error] RTDB ${tableName} confirmation listener failed:`, error);
    }
  );
});

console.log(`[Daemon] Synchronization daemon is running. Waiting for events...\n`);
