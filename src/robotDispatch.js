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
  const route = normalizeRouteValue(robot.route);
  return (
    robot.move !== true &&
    (robot.trip_status || "idle") === "idle" &&
    route.length === 0 &&
    robot.home !== true
  );
}

function buildTripState(route = [], targets = []) {
  const nextRobot = buildIdleRobotState();
  nextRobot.move = true;
  nextRobot.route = route;
  nextRobot.active_table = route[0] || null;
  nextRobot.trip_status = "en_route";

  for (const tableName of TABLES) {
    if (targets.includes(tableName)) {
      nextRobot[tableName] = {
        mission: "destination",
        status: false,
        arrived: false,
        confirmed: false,
      };
    } else if (route.includes(tableName)) {
      nextRobot[tableName] = {
        mission: "pass_through",
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
        return;
      }
      return buildTripState(route, activeTargets);
    });

    if (!transactionResult.committed) {
      console.log(`Robot ${ROBOT_ID} was claimed by another trip update.`);
      return;
    }

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
  console.log("[Client Sync] Active dispatch listeners initialized on client tab.");

  let previousReadyIds = new Set();

  const readyOrdersQuery = query(
    collection(firestore, "orders"),
    where("status", "==", "ready"),
  );

  const unsubOrders = onSnapshot(readyOrdersQuery, (snapshot) => {
    console.log(`[Client Sync] Firestore snapshot received. ${snapshot.size} orders are currently 'ready'.`);
    const currentReadyIds = new Set(snapshot.docs.map((d) => d.id));
    const justBecameReady = [...currentReadyIds].some(
      (id) => !previousReadyIds.has(id),
    );
    previousReadyIds = currentReadyIds;

    if (justBecameReady) {
      console.log("[Client Sync] New 'ready' order detected in Firestore. Checking robot availability...");
      dispatchReadyOrdersIfPossible(firestore, database);
    }
  });

  let previousTripStatus = null;
  const tripStatusRef = ref(database, `${ROBOT_ID}/trip_status`);

  const unsubTripStatus = onValue(tripStatusRef, (snapshot) => {
    const afterStatus = snapshot.val();
    console.log(`[Client Sync] RTDB: Robot '${ROBOT_ID}' trip_status is '${afterStatus}'.`);
    const becameIdle = afterStatus === "idle" && previousTripStatus !== "idle";
    previousTripStatus = afterStatus;

    if (becameIdle) {
      console.log("[Client Sync] Robot is now idle. Triggering dispatch for any queued orders...");
      dispatchReadyOrdersIfPossible(firestore, database);
    }
  });

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
    unsubOrders();
    unsubTripStatus();
    unsubsTables.forEach((unsub) => unsub());
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
    // Robot is busy, but we manually assign the order in Firestore anyway (it queues for the next trip)
    await updateDoc(doc(firestore, "orders", orderId), {
      assignedRobot: ROBOT_ID,
      dispatchedAt: serverTimestamp(),
      status: "ready",
    });
    return { queued: true };
  }

  const payload = buildTripState(expandRoute([tableName]), [tableName]);

  const transactionResult = await runTransaction(robotRef, (current) => {
    const currentRobot = current || buildIdleRobotState();
    if (!canStartTrip(currentRobot)) {
      return;
    }
    return payload;
  });

  if (!transactionResult.committed) {
    // If claim failed during transaction, we still assign the order in Firestore!
    await updateDoc(doc(firestore, "orders", orderId), {
      assignedRobot: ROBOT_ID,
      dispatchedAt: serverTimestamp(),
      status: "ready",
    });
    return { queued: true };
  }

  await updateDoc(doc(firestore, "orders", orderId), {
    assignedRobot: ROBOT_ID,
    dispatchedAt: serverTimestamp(),
    status: "ready",
  });

  dispatchState.lastSuccessAt = new Date();
  dispatchState.lastError = null;

  return { queued: false };
}

export function getDispatchStatus() {
  return {
    ...dispatchState,
    lastSuccessAt: dispatchState.lastSuccessAt
      ? dispatchState.lastSuccessAt.toISOString()
      : null,
  };
}
