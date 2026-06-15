const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.syncReadyOrders = functions.firestore
  .document("orders/{orderId}")
  .onWrite((change, context) => {
    // If the document was deleted, do nothing
    if (!change.after.exists) {
      return null;
    }

    const orderId = context.params.orderId;
    const orderData = change.after.data();

    // Only sync if the status is "ready"
    if (orderData.status === "ready") {
      const db = admin.database();
      const rtdbRef = db.ref(`orders/${orderId}`);

      // Write the table number and timestamp to RTDB
      return rtdbRef.set({
        tableNumber: orderData.tableNumber,
        timestamp: orderData.timestamp || admin.database.ServerValue.TIMESTAMP
      }).then(() => {
        console.log(`Order ${orderId} synced to RTDB. Table: ${orderData.tableNumber}`);
      }).catch((error) => {
        console.error(`Error syncing order ${orderId}:`, error);
      });
    }

    return null;
  });
