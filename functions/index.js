const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.syncReadyOrders = functions.firestore
  .document("orders/{orderId}")
  .onWrite(async (change, context) => {
    if (!change.after.exists) return null;

    const orderId = context.params.orderId;
    const orderData = change.after.data();
    const tableNumber = orderData.tableNumber || orderData.table;

    // Trigger only when status changes to "ready"
    if (orderData.status === "ready" && tableNumber) {
      const rtdb = admin.database();
      const robotsRef = rtdb.ref("robots");

      try {
        // 1. Find an available robot
        const snapshot = await robotsRef.once("value");
        const robots = snapshot.val();
        let assignedRobotId = null;

        if (robots) {
          for (const robotId in robots) {
            if (robots[robotId].status === "docked" || robots[robotId].command === "IDLE") {
              assignedRobotId = robotId;
              break;
            }
          }
        }

        if (assignedRobotId) {
          // 2. Dispatch the robot
          await robotsRef.child(assignedRobotId).update({
            command: "GO_TO_TABLE",
            destination: tableNumber,
            currentTable: tableNumber,
            status: "delivering",
            lastOrderId: orderId,
            currentTask: `Delivering to Table ${tableNumber}`,
            progress: 0
          });

          // 3. Log the assignment in Firestore
          await change.after.ref.update({
            assignedRobot: assignedRobotId,
            dispatchedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          console.log(`Order ${orderId} assigned to Robot ${assignedRobotId}`);
        } else {
          console.log(`No robots available for Order ${orderId}`);
        }
      } catch (error) {
        console.error("Error dispatching robot:", error);
      }
    }

    return null;
  });
