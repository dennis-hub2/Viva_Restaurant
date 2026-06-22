const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const COMMANDS = {
  GO_TO_TABLE: "GO_TO_TABLE",
};

const STATUSES = {
  DOCKED: "docked",
  MAINTENANCE: "maintenance",
};

const ONLINE_WINDOW_MS = 15000;

function nowIso() {
  return new Date().toISOString();
}

function isRobotOnline(robot = {}) {
  if (!robot.lastSeenAt) return false;
  const lastSeenMs = Date.parse(robot.lastSeenAt);
  if (Number.isNaN(lastSeenMs)) return false;
  return Date.now() - lastSeenMs <= ONLINE_WINDOW_MS;
}

function isDispatchable(robot = {}) {
  const idle = robot.command === "IDLE" || !robot.command;
  return (
    robot.status === STATUSES.DOCKED &&
    idle &&
    robot.status !== STATUSES.MAINTENANCE &&
    isRobotOnline(robot)
  );
}

exports.syncReadyOrders = functions.firestore
  .document("orders/{orderId}")
  .onWrite(async (change, context) => {
    if (!change.after.exists) return null;

    const beforeData = change.before.exists ? change.before.data() : null;
    const orderData = change.after.data();
    const orderId = context.params.orderId;
    const tableNumber = Number(orderData.tableNumber || orderData.table);
    const justBecameReady =
      orderData.status === "ready" && beforeData?.status !== "ready";

    if (!justBecameReady || !tableNumber || orderData.assignedRobot) {
      return null;
    }

    const rtdb = admin.database();
    const robotsRef = rtdb.ref("robots");

    try {
      const snapshot = await robotsRef.once("value");
      const robots = snapshot.val() || {};
      const assignedRobotId = Object.keys(robots).find((robotId) =>
        isDispatchable(robots[robotId]),
      );

      if (!assignedRobotId) {
        console.log(`No eligible robot available for order ${orderId}`);
        return null;
      }

      const commandId = `${orderId}-${Date.now()}`;
      await robotsRef.child(assignedRobotId).update({
        command: COMMANDS.GO_TO_TABLE,
        commandId,
        commandUpdatedAt: nowIso(),
        destination: tableNumber,
        currentTable: tableNumber,
        status: "delivering",
        lastOrderId: orderId,
        currentTask: `Delivering to Table ${tableNumber}`,
        progress: 0,
        currentPath: [],
        lastError: null,
      });

      await change.after.ref.update({
        assignedRobot: assignedRobotId,
        dispatchedAt: admin.firestore.FieldValue.serverTimestamp(),
        robotCommandId: commandId,
      });

      console.log(`Order ${orderId} assigned to robot ${assignedRobotId}`);
    } catch (error) {
      console.error("Error dispatching robot:", error);
    }

    return null;
  });
