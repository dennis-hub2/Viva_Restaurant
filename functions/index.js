const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const ROBOT_ID = "swagbot1";
const TABLES = ["table1", "table2", "table3", "table4"];

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
        return;
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

// Note: Auto-dispatch triggers disabled. Robot delivery assignment is strictly manual from KDS.
exports.syncReadyOrders = functions.firestore
  .document("orders/{orderId}")
  .onWrite(async () => {
    // Manual dispatch mode enabled: Kitchen staff explicitly assigns robot from KDS.
    return null;
  });

exports.dispatchQueuedOrdersWhenRobotIdle = functions.database
  .ref(`${ROBOT_ID}/trip_status`)
  .onWrite(async () => {
    // Manual dispatch mode enabled: Robot waits at dock until assigned from KDS.
    return null;
  });
