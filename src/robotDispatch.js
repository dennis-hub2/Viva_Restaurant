// robotDispatch.js
//
// Client-side replacement for the two Cloud Functions:
//   - syncReadyOrders            (was: functions.firestore.document('orders/{orderId}').onWrite)
//   - dispatchQueuedOrdersWhenRobotIdle (was: functions.database.ref('swagbot1/trip_status').onWrite)
//
// WHY THIS EXISTS:
// Cloud Functions require the Blaze plan (specifically cloudbuild.googleapis.com).
// This file reproduces the same dispatch logic using only the Firebase Web SDK,
// which works fine on the free Spark plan. It must run inside a persistent
// "backend" client (e.g. a kitchen/staff dashboard page) that stays open,
// since there's no server pushing this logic anymore - a live listener has
// to replace the trigger.
//
// REQUIREMENTS:
// 1. The signed-in user must have a custom claim auth.token.role === 'backend'
//    (set once via the Admin SDK from a local script - see note at bottom).
// 2. Firestore & RTDB security rules must allow that 'backend' role to:
//    - read orders where status == 'ready'
//    - update orders (assignedRobot, dispatchedAt)
//    - read/write swagbot1/* in RTDB
// 3. Call initDispatchListeners() once, after the user is authenticated,
//    e.g. on app startup / dashboard mount. Keep the tab open.

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
} from "firebase/firestore";

import {
  getDatabase,
  ref,
  runTransaction,
  onValue,
  get,
} from "firebase/database";

const ROBOT_ID = "swagbot1";
const TABLES = ["table1", "table2", "table3", "table4"];

const dispatchState = {
  listenersActive: false,
  lastSuccessAt: null,
  lastError: null,
  manualRuns: 0,
};

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
    active_table: null,
    trip_status: "idle",
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
  const route = normalizeRouteValue(robot.route);
  return (
    robot.move !== true &&
    (robot.trip_status || "idle") === "idle" &&
    route.length === 0 &&
    robot.home !== true
  );
}

function buildTripState(route = []) {
  const nextRobot = buildIdleRobotState();
  nextRobot.move = true;
  nextRobot.route = route;
  nextRobot.active_table = route[0] || null;
  nextRobot.trip_status = "en_route";

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

    const route = sortRoute(
      dispatchableOrders
        .map((docSnap) => getOrderTableName(docSnap.data()))
        .filter(Boolean),
    );

    if (route.length === 0) {
      dispatchState.lastSuccessAt = new Date();
      dispatchState.lastError = null;
      return;
    }

    const transactionResult = await runTransaction(robotRef, (current) => {
      const currentRobot = current || buildIdleRobotState();
      if (!canStartTrip(currentRobot)) {
        return;
      }
      return buildTripState(route);
    });

    if (!transactionResult.committed) {
      console.log(`Robot ${ROBOT_ID} was claimed by another trip update.`);
      return;
    }

    const batch = writeBatch(firestore);
    dispatchableOrders.forEach((docSnap) => {
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
 * Call this once after the "backend" user is signed in, e.g. on dashboard mount.
 * Keeps two live listeners running for as long as the page stays open:
 *   1. Firestore: any order transitioning to status "ready"
 *   2. RTDB: robot trip_status changing to "idle"
 * Returns an unsubscribe function you can call on unmount.
 */
export function initDispatchListeners() {
  const firestore = getFirestore();
  const database = getDatabase();
  dispatchState.listenersActive = true;

  let previousReadyIds = new Set();

  const readyOrdersQuery = query(
    collection(firestore, "orders"),
    where("status", "==", "ready"),
  );

  const unsubOrders = onSnapshot(readyOrdersQuery, (snapshot) => {
    const currentReadyIds = new Set(snapshot.docs.map((d) => d.id));
    const justBecameReady = [...currentReadyIds].some(
      (id) => !previousReadyIds.has(id),
    );
    previousReadyIds = currentReadyIds;

    if (justBecameReady) {
      dispatchReadyOrdersIfPossible(firestore, database);
    }
  });

  let previousTripStatus = null;
  const tripStatusRef = ref(database, `${ROBOT_ID}/trip_status`);

  const unsubTripStatus = onValue(tripStatusRef, (snapshot) => {
    const afterStatus = snapshot.val();
    const becameIdle = afterStatus === "idle" && previousTripStatus !== "idle";
    previousTripStatus = afterStatus;

    if (becameIdle) {
      dispatchReadyOrdersIfPossible(firestore, database);
    }
  });

  return () => {
    unsubOrders();
    unsubTripStatus();
    dispatchState.listenersActive = false;
  };
}

export async function runManualDispatch() {
  const firestore = getFirestore();
  const database = getDatabase();
  dispatchState.manualRuns += 1;
  await dispatchReadyOrdersIfPossible(firestore, database);
  return getDispatchStatus();
}

export async function assignRobotForOrder(order) {
  const firestore = getFirestore();
  const database = getDatabase();
  const robotRef = ref(database, ROBOT_ID);
  const tableName = getOrderTableName(order);

  if (!tableName) {
    throw new Error("order-has-no-valid-table");
  }

  const orderId = order?.id;
  if (!orderId) {
    throw new Error("missing-order-id");
  }

  const robotSnapshot = await get(robotRef);
  const robot = robotSnapshot.val() || buildIdleRobotState();

  if (!canStartTrip(robot)) {
    throw new Error("robot-busy");
  }

  const payload = buildTripState([tableName]);

  const transactionResult = await runTransaction(robotRef, (current) => {
    const currentRobot = current || buildIdleRobotState();
    if (!canStartTrip(currentRobot)) {
      return;
    }
    return payload;
  });

  if (!transactionResult.committed) {
    throw new Error("robot-claim-failed");
  }

  await updateDoc(doc(firestore, "orders", orderId), {
    assignedRobot: ROBOT_ID,
    dispatchedAt: serverTimestamp(),
    status: "ready",
  });

  dispatchState.lastSuccessAt = new Date();
  dispatchState.lastError = null;

  return getDispatchStatus();
}

export function getDispatchStatus() {
  return {
    ...dispatchState,
    lastSuccessAt: dispatchState.lastSuccessAt
      ? dispatchState.lastSuccessAt.toISOString()
      : null,
  };
}
