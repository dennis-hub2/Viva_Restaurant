/**
 * @file index.js
 * @description Cloud Functions for Serverless Robot Dispatching and Background Order Synchronization.
 * 
 * Thesis Context:
 * In a distributed cyber-physical dining ecosystem, background cloud triggers can autonomously evaluate
 * kitchen order states and schedule robot delivery runs.
 * 
 * Architectural Highlights:
 * 1. Transactional Concurrency: Uses RTDB transactions to prevent duplicate dispatch collisions.
 * 2. Unidirectional Route Sequencing: Enforces sequential perimeter routing along tables 1 to 4.
 * 3. Operational Mode Flexibility: While fully autonomous event-driven triggers (`syncReadyOrders`,
 *    `dispatchQueuedOrdersWhenRobotIdle`) are implemented, manual KDS dispatch mode is active by default
 *    to give kitchen expeditors explicit physical oversight over dish placement onto the robot tray.
 * 
 * @module functions
 * @author Thesis Research Team
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK with default server credentials
admin.initializeApp();

/**
 * Identifier of the managed autonomous robotic delivery vehicle.
 * @constant {string}
 */
const ROBOT_ID = "swagbot1";

/**
 * Invariant sequence of table stations along the delivery perimeter.
 * @constant {string[]}
 */
const TABLES = ["table1", "table2", "table3", "table4"];

/**
 * Factory for creating clean table station sub-document state.
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
 * Constructs the default idle telemetry state for the robot node in RTDB.
 * 
 * @returns {Object} Complete idle robot state schema
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
 * Normalizes and extracts the table identifier string (e.g. 'table1') from an order document.
 * 
 * @param {Object} [order={}] - Firestore order document data
 * @returns {string|null} Valid table station identifier or null
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
 * Sorts table stations in perimeter sequence order: Table 1 -> Table 2 -> Table 3 -> Table 4.
 * 
 * @param {string[]} route - Array of table station identifiers
 * @returns {string[]} Monotonically sorted, deduplicated route
 */
function sortRoute(route) {
  return [...new Set(route)].sort(
    (left, right) => TABLES.indexOf(left) - TABLES.indexOf(right),
  );
}

/**
 * Sanitizes arbitrary route input formats (arrays or key-value dictionaries).
 * 
 * @param {Array|Object|null} route - Raw route data
 * @returns {string[]} Validated, sequential table array
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
 * Evaluates whether the robot is eligible to embark on a delivery journey.
 * 
 * @param {Object} [robot={}] - Current robot state snapshot from RTDB
 * @returns {boolean} True if robot is idle/docked and ready for movement
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
 * Generates the updated RTDB trip payload flagging designated destination stations.
 * 
 * @param {Object} [currentRobot={}] - Existing robot state
 * @param {string[]} [route=[]] - Delivery route sequence
 * @returns {Object} Merged trip state ready for RTDB commit
 */
function buildTripState(currentRobot = {}, route = []) {
  const nextRobot = {
    ...buildIdleRobotState(),
    ...currentRobot,
    move: true,
    route,
    trip_status: "en_route",
  };

  for (const tableName of TABLES) {
    nextRobot[tableName] = route.includes(tableName)
      ? {
        mission: "destination",
        status: false,
        arrived: false,
        confirmed: false,
      }
      : tableState();
  }

  return nextRobot;
}

/**
 * Serverless batch dispatcher: scans Firestore for tickets with status 'ready'
 * and initiates an atomic robot trip via RTDB transaction if the robot is idle.
 * 
 * @returns {Promise<null>}
 */
async function dispatchReadyOrdersIfPossible() {
  const firestore = admin.firestore();
  const robotRef = admin.database().ref(ROBOT_ID);

  try {
    const [readyOrdersSnapshot, robotSnapshot] = await Promise.all([
      firestore.collection("orders").where("status", "==", "ready").get(),
      robotRef.get(),
    ]);

    const robot = robotSnapshot.val() || buildIdleRobotState();
    if (!canStartTrip(robot)) {
      console.log(`Robot ${ROBOT_ID} is busy; ready orders remain queued.`);
      return null;
    }

    const dispatchableOrders = readyOrdersSnapshot.docs.filter((doc) => {
      const data = doc.data();
      return !data.assignedRobot && getOrderTableName(data);
    });

    const route = sortRoute(
      dispatchableOrders
        .map((doc) => getOrderTableName(doc.data()))
        .filter(Boolean),
    );

    if (route.length === 0) {
      return null;
    }

    const transaction = await robotRef.transaction((current) => {
      const currentRobot = current || buildIdleRobotState();
      if (!canStartTrip(currentRobot)) {
        return; // Abort transaction if concurrent modification occurred
      }

      return buildTripState(currentRobot, route);
    });

    if (!transaction.committed) {
      console.log(`Robot ${ROBOT_ID} was claimed by another trip update.`);
      return null;
    }

    const batch = firestore.batch();
    dispatchableOrders.forEach((doc) => {
      batch.update(doc.ref, {
        assignedRobot: ROBOT_ID,
        dispatchedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();

    console.log(`Started trip for ${ROBOT_ID} with route ${route.join(" -> ")}`);
  } catch (error) {
    console.error("Failed to create robot trip:", error);
  }

  return null;
}

/**
 * Cloud Function Trigger: Firestore `orders/{orderId}` onWrite.
 * 
 * Note: Automated auto-dispatch is currently bypassed in favor of explicit,
 * staff-governed manual dispatch triggered directly from the Kitchen Display System (KDS).
 */
exports.syncReadyOrders = functions.firestore
  .document("orders/{orderId}")
  .onWrite(async () => {
    // Manual dispatch mode enabled: Kitchen staff explicitly assigns robot from KDS.
    return null;
  });

/**
 * Cloud Function Trigger: Realtime Database `${ROBOT_ID}/trip_status` onWrite.
 * 
 * Note: Autonomous re-dispatch upon robot docking is handled with manual safety oversight
 * in the active thesis demonstration profile.
 */
exports.dispatchQueuedOrdersWhenRobotIdle = functions.database
  .ref(`${ROBOT_ID}/trip_status`)
  .onWrite(async () => {
    // Manual dispatch mode enabled: Robot waits at dock until assigned from KDS.
    return null;
  });
