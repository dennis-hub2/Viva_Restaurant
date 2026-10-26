/**
 * @file robotDispatch.js
 * @description Autonomous Robot Dispatch Engine, Multi-Stop Route Planner, and Two-Way Sync Handler.
 * 
 * Thesis Context:
 * In smart restaurant environments, transitioning prepared kitchen tickets into physical robotic deliveries
 * requires resolving concurrency, race conditions, and spatial constraints.
 * 
 * This module coordinates:
 * 1. State Invariant Checking: Ensuring 'swagbot1' is docked, available, and not already engaged.
 * 2. Route Expansion Algorithm (`expandRoute`): Expanding destination stops into a sequential perimeter path.
 * 3. Atomic Database Synchronization: Executing RTDB transactions for robot command dispatch alongside
 *    Firestore batch writes for order tracking status updates.
 * 4. Dual-Directional Event Handshaking (`initDispatchListeners`): Reacting to real-time table delivery confirmations
 *    in RTDB to automatically transition the corresponding Firestore order document from 'ready' to 'completed'.
 * 
 * @module robotDispatch
 * @author Thesis Research Team
 */

import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  writeBatch,
  doc,
  updateDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";

import {
  getDatabase,
  ref,
  runTransaction,
  onValue,
  get,
} from "firebase/database";

/**
 * Identifier of the target robotic delivery vehicle.
 * @constant {string}
 */
const ROBOT_ID = "swagbot1";

/**
 * Sequenced list of dining table station markers.
 * @constant {string[]}
 */
const TABLES = ["table1", "table2", "table3", "table4"];

/**
 * In-memory telemetry and observability state for the dispatch engine.
 * @type {{listenersActive: boolean, lastSuccessAt: Date|null, lastError: string|null, manualRuns: number}}
 */
const dispatchState = {
  listenersActive: false,
  lastSuccessAt: null,
  lastError: null,
  manualRuns: 0,
};

/**
 * Factory creating default station flags for an idle table.
 * 
 * @returns {{mission: string, status: boolean, arrived: boolean, confirmed: boolean}}
 */
function tableState() {
  return {
    mission: "idle",
    status: false,
    arrived: false,
    confirmed: false,
  };
}

/**
 * Builds the comprehensive idle state representation for the delivery robot.
 * 
 * @returns {Object} Complete default robot schema
 */
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

/**
 * Parses and sanitizes an order payload to extract its destination table identifier (e.g. 'table2').
 * Supports multiple naming conventions (tableName, table, tableNumber) and regex digit extraction.
 * 
 * @param {Object} [order={}] - Order data document
 * @returns {string|null} Valid table station identifier (e.g. 'table1'), or null if unresolvable
 */
function getOrderTableName(order = {}) {
  const rawTable = order.tableName || order.table || order.tableNumber;
  if (rawTable == null) return null;

  const match = String(rawTable).trim().toLowerCase().match(/(\d+)/);
  if (!match) return null;

  const tableName = `table${match[1]}`;
  return TABLES.includes(tableName) ? tableName : null;
}

/**
 * Sorts unique table names along the unidirectional loop perimeter order.
 * 
 * @param {string[]} route - Array of table names
 * @returns {string[]} Monotonically ordered route array
 */
function sortRoute(route) {
  return [...new Set(route)].sort(
    (left, right) => TABLES.indexOf(left) - TABLES.indexOf(right),
  );
}

/**
 * Expands a target set of delivery stops into a contiguous perimeter route starting from table1.
 * 
 * Thesis Note on Track Topology:
 * Because the robot operates on a unidirectional physical guide path (docking -> table1 -> ... -> table4 -> docking),
 * reaching Table 3 requires passing Table 1 and Table 2. Expanding the route slice [0 ... maxIndex]
 * guarantees the microcontroller can evaluate each consecutive checkpoint on its path.
 * 
 * @param {string[]} route - Array of target destination table names
 * @returns {string[]} Expanded array of all tables traversed up to the furthest target stop
 */
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

/**
 * Normalizes an arbitrary route value (Array or Object dictionary) into a validated sorted array.
 * 
 * @param {Array|Object|null} route - Raw route data
 * @returns {string[]} Validated table names
 */
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

/**
 * Evaluates whether the robot is physically and computationally ready to initiate a new dispatch trip.
 * 
 * Preconditions:
 * 1. Robot is not currently in motion (`move !== true`).
 * 2. Robot trip status is either "docking" or "idle".
 * 3. Robot is not currently executing a return command (`home !== true`).
 * 
 * @param {Object} [robot={}] - Current robot node snapshot
 * @returns {boolean} True if robot is eligible to start a delivery
 */
function canStartTrip(robot = {}) {
  const status = robot.trip_status || "docking";
  return (
    robot.move !== true &&
    (status === "docking" || status === "idle") &&
    robot.home !== true
  );
}

/**
 * Constructs the new RTDB trip payload for the robot with active destination tables flagged.
 * 
 * @param {string[]} [route=[]] - Full traversed path
 * @param {string[]} [targets=[]] - Specific tables receiving food deliveries
 * @returns {Object} Complete trip state object for RTDB update
 */
function buildTripState(route = [], targets = []) {
  const nextRobot = buildIdleRobotState();
  nextRobot.move = true;
  nextRobot.route = route;
  nextRobot.trip_status = "en_route";

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

/**
 * Automated batch dispatcher: finds ready unassigned orders in Firestore and starts a batched delivery.
 * 
 * Concurrency Safety:
 * Employs a Firebase RTDB transaction on `/swagbot1` to prevent race conditions when multiple
 * clients or functions attempt simultaneous dispatches.
 * 
 * @param {import('firebase/firestore').Firestore} firestore - Firestore instance
 * @param {import('firebase/database').Database} database - Realtime Database instance
 * @returns {Promise<void>}
 */
async function dispatchReadyOrdersIfPossible(firestore, database) {
  const robotRef = ref(database, ROBOT_ID);

  try {
    const readyOrdersQuery = query(
      collection(firestore, "orders"),
      where("status", "==", "ready"),
    );

    const [readyOrdersSnapshot, robotSnapshot] = await Promise.all([
      new Promise((resolve, reject) => {
        const unsub = onSnapshot(
          readyOrdersQuery,
          (snap) => {
            unsub();
            resolve(snap);
          },
          reject,
        );
      }),
      get(robotRef),
    ]);

    const robot = robotSnapshot.val() || buildIdleRobotState();
    if (!canStartTrip(robot)) {
      console.log(`Robot ${ROBOT_ID} is busy; ready orders remain queued.`);
      dispatchState.lastSuccessAt = new Date();
      dispatchState.lastError = null;
      return;
    }

    const dispatchableOrders = readyOrdersSnapshot.docs.filter((docSnap) => {
      const data = docSnap.data();
      return !data.assignedRobot && getOrderTableName(data);
    });

    const targets = sortRoute(
      dispatchableOrders
        .map((docSnap) => getOrderTableName(docSnap.data()))
        .filter(Boolean)
    );
    // Batch limit: maximum of 2 destination tables per delivery trip for balancing payload & speed
    const activeTargets = targets.slice(0, 2);
    const route = expandRoute(activeTargets);

    if (route.length === 0) {
      dispatchState.lastSuccessAt = new Date();
      dispatchState.lastError = null;
      return;
    }

    const transactionResult = await runTransaction(robotRef, (current) => {
      const currentRobot = current || buildIdleRobotState();
      if (!canStartTrip(currentRobot)) {
        return; // Abort transaction if another process updated robot state
      }
      return buildTripState(route, activeTargets);
    });

    if (!transactionResult.committed) {
      console.log(`Robot ${ROBOT_ID} was claimed by another trip update.`);
      return;
    }

    // Atomic update in Firestore marking orders as dispatched and assigned to ROBOT_ID
    const ordersToAssign = dispatchableOrders.filter((docSnap) => {
      return activeTargets.includes(getOrderTableName(docSnap.data()));
    });

    const batch = writeBatch(firestore);
    ordersToAssign.forEach((docSnap) => {
      batch.update(doc(firestore, "orders", docSnap.id), {
        assignedRobot: ROBOT_ID,
        dispatchedAt: serverTimestamp(),
      });
    });
    await batch.commit();

    console.log(
      `Started trip for ${ROBOT_ID} with route ${route.join(" -> ")}`,
    );
    dispatchState.lastSuccessAt = new Date();
    dispatchState.lastError = null;
  } catch (error) {
    console.error("Failed to create robot trip:", error);
    dispatchState.lastError =
      error instanceof Error ? error.message : String(error);
  }
}

/**
 * Initializes persistent real-time listeners synchronizing RTDB delivery confirmations into Firestore.
 * 
 * Handshake Mechanism:
 * When a customer or waiter confirms delivery at Table X in RTDB (`swagbot1/tableX/confirmed = true`),
 * this listener queries corresponding Firestore tickets for Table X and marks their status as 'completed'.
 * 
 * @returns {Function} Cleanup/unsubscribe callback to release WebSocket listeners
 */
export function initDispatchListeners() {
  const firestore = getFirestore();
  const database = getDatabase();
  dispatchState.listenersActive = true;
  console.log("[Client Sync] Active dispatch listeners initialized (Manual Dispatch Mode).");

  const unsubsTables = TABLES.map((tableName) => {
    const tableConfirmedRef = ref(database, `${ROBOT_ID}/${tableName}/confirmed`);
    return onValue(tableConfirmedRef, async (snapshot) => {
      const confirmed = snapshot.val();
      if (confirmed === true) {
        console.log(`[Client Sync] Table ${tableName} confirmed in RTDB. Syncing to Firestore...`);
        try {
          const readyOrdersQuery = query(
            collection(firestore, "orders"),
            where("status", "==", "ready"),
            where("assignedRobot", "==", ROBOT_ID)
          );
          const snap = await getDocs(readyOrdersQuery);
          const batch = writeBatch(firestore);
          let count = 0;

          snap.docs.forEach((docSnap) => {
            const data = docSnap.data();
            if (getOrderTableName(data) === tableName) {
              batch.update(doc(firestore, "orders", docSnap.id), {
                status: "completed",
                completedAt: serverTimestamp(),
              });
              count++;
            }
          });

          if (count > 0) {
            await batch.commit();
            console.log(`[Client Sync] Marked ${count} orders for ${tableName} as completed in Firestore.`);
          }
        } catch (e) {
          console.error(`[Client Sync] Error updating orders for ${tableName}:`, e);
        }
      }
    });
  });

  return () => {
    unsubsTables.forEach((unsub) => unsub());
    dispatchState.listenersActive = false;
  };
}

/**
 * Manually executes a single dispatch cycle on demand.
 * 
 * @returns {Promise<Object>} Updated dispatch status report
 */
export async function runManualDispatch() {
  const firestore = getFirestore();
  const database = getDatabase();
  dispatchState.manualRuns += 1;
  await dispatchReadyOrdersIfPossible(firestore, database);
  return getDispatchStatus();
}

/**
 * Dispatches the robot specifically for an individual kitchen order (invoked from KDS).
 * 
 * Execution Steps:
 * 1. Validates target table name and order ID.
 * 2. Computes the expanded unidirectional trajectory route.
 * 3. Commits atomic RTDB state: route, target table 'destination' mission, move: true, status: 'en_route'.
 * 4. Updates Cloud Firestore ticket to 'ready' with assigned robot and server timestamp.
 * 
 * @param {Object} order - Kitchen order ticket document
 * @param {string} [chosenRobotId=ROBOT_ID] - Robot identifier
 * @returns {Promise<{queued: boolean}>} Dispatch outcome
 * @throws {Error} If order lacks valid table assignment or order ID
 */
export async function assignRobotForOrder(order, chosenRobotId = ROBOT_ID) {
  const firestore = getFirestore();
  const database = getDatabase();
  const targetRobotId = chosenRobotId || ROBOT_ID;
  const robotRef = ref(database, targetRobotId);
  const tableName = getOrderTableName(order);

  if (!tableName) {
    throw new Error("order-has-no-valid-table");
  }

  const orderId = order?.id;
  if (!orderId) {
    throw new Error("missing-order-id");
  }

  const route = expandRoute([tableName]);
  const activeTargets = [tableName];
  const payload = buildTripState(route, activeTargets);

  // Enforce clean state for destination table (reset arrived and confirmed flags)
  payload[tableName] = {
    mission: "destination",
    status: false,
    arrived: false,
    confirmed: false,
  };
  payload.home = false;
  payload.move = true;
  payload.trip_status = "en_route";

  // Commit synchronized RTDB state update
  await runTransaction(robotRef, () => payload);

  // Commit Firestore ticket update
  await updateDoc(doc(firestore, "orders", orderId), {
    assignedRobot: targetRobotId,
    dispatchedAt: serverTimestamp(),
    status: "ready",
  });

  dispatchState.lastSuccessAt = new Date();
  dispatchState.lastError = null;

  return { queued: false };
}

/**
 * Retrieves the current execution and health telemetry of the dispatch engine.
 * 
 * @returns {Object} Diagnostic snapshot
 */
export function getDispatchStatus() {
  return {
    ...dispatchState,
    lastSuccessAt: dispatchState.lastSuccessAt
      ? dispatchState.lastSuccessAt.toISOString()
      : null,
  };
}
