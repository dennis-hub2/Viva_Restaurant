import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  fs.readFileSync(path.resolve("scripts/serviceAccountKey.json"), "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const firestore = admin.firestore();

async function inspectMenu() {
  const snapshot = await firestore.collection("menuItems").get();
  const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(JSON.stringify(items, null, 2));
  process.exit(0);
}

inspectMenu().catch(err => {
  console.error(err);
  process.exit(1);
});
