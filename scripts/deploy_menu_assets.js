import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  fs.readFileSync(path.resolve("scripts/serviceAccountKey.json"), "utf8")
);

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const firestore = admin.firestore();

const ARTIFACTS_DIR = "C:/Users/ForEIgNa/.gemini/antigravity-ide/brain/0e4f0bd6-5f1c-40e4-a368-7bafeb22fbba";
const PUBLIC_IMAGES_DIR = path.resolve("public/images");

// Ensure public/images directory exists
if (!fs.existsSync(PUBLIC_IMAGES_DIR)) {
  fs.mkdirSync(PUBLIC_IMAGES_DIR, { recursive: true });
}

// Food name mappings
const foodMapping = {
  "Matcha Lava Cake": {
    filename: "matcha_lava_cake",
    desc: "Warm matcha cake, vanilla ice cream, red bean"
  },
  "Miso Ramen": {
    filename: "miso_ramen",
    desc: "Rich miso broth, chashu pork, soft egg, bamboo shoots"
  },
  "Goat Soup": {
    filename: "goat_soup",
    desc: "Rich and spiced traditional goat soup simmered with local herbs and hot peppers."
  },
  "Assorted Jollof": {
    filename: "assorted_jollof",
    desc: "Fragrant, smoky Jollof rice served with grilled chicken, beef, fried plantain, and boiled egg."
  },
  "Coke": {
    filename: "coke",
    desc: "Chilled classic Coca-Cola can to refresh your palate."
  },
  "Tuna Tartare": {
    filename: "tuna_tartare",
    desc: "Ahi tuna, avocado, sesame, citrus ponzu."
  },
  "Waffles ": { // Note the trailing space in the database name!
    filename: "waffles",
    desc: "Premium vanilla waffles with honey syrup."
  },
  "Fish Cake": {
    filename: "fish_cake",
    desc: "Two golden-brown pan-fried fish cakes served with tartar sauce."
  },
  "Waakye": {
    filename: "waakye",
    desc: "Assorted Ghanaian waakye with fried plantains, meat, egg, wele, fish with salad."
  },
  "Stir fried Noodle": {
    filename: "stir_fried_noodle",
    desc: "Stir-fried wheat noodles tossed with fresh garden vegetables, savory soy-based sauce, and aromatic garlic."
  },
  "Lobster Bisque": {
    filename: "lobster_bisque",
    desc: "Creamy Maine lobster bisque, cognac cream, chives."
  },
  "Crispy Chicken ": { // Note trailing space
    filename: "crispy_chicken",
    desc: "Slow-cooked chicken thigh with sauce and sesame garnish."
  },
  "Tuna Pizza": {
    filename: "tuna_pizza",
    desc: "Crispy thin crust pizza topped with flaked tuna, red onions, black olives, and melted mozzarella."
  },
  "Beef Burger": {
    filename: "beef_burger",
    desc: "Juicy flame-grilled beef patty with fresh lettuce, sliced tomatoes, cheddar cheese, and house sauce in a brioche bun."
  }
};

async function deployMenu() {
  console.log("1. Copying generated images to public/images/...");
  
  const files = fs.readdirSync(ARTIFACTS_DIR);
  
  for (const [foodName, config] of Object.entries(foodMapping)) {
    // Find the file in artifacts folder that starts with the filename and ends with .png
    const matchingFile = files.find(f => f.startsWith(config.filename) && f.endsWith(".png"));
    
    if (matchingFile) {
      const srcPath = path.join(ARTIFACTS_DIR, matchingFile);
      const destPath = path.join(PUBLIC_IMAGES_DIR, `${config.filename}.png`);
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${matchingFile} -> public/images/${config.filename}.png`);
    } else {
      console.warn(`WARNING: No matching image found for ${foodName} (expected prefix: ${config.filename})`);
    }
  }
  
  console.log("\n2. Updating Firestore menuItems database...");
  const snapshot = await firestore.collection("menuItems").get();
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const cleanName = data.name;
    
    if (foodMapping[cleanName]) {
      const config = foodMapping[cleanName];
      const imagePath = `/images/${config.filename}.png`;
      
      await doc.ref.update({
        desc: config.desc,
        image: imagePath
      });
      console.log(`Updated Firestore document for: "${cleanName}" with image "${imagePath}" and description.`);
    } else {
      console.warn(`WARNING: Database item "${cleanName}" has no mapping config.`);
    }
  }
  
  console.log("\nSuccessfully completed asset deployment and Firestore updates!");
  process.exit(0);
}

deployMenu().catch(err => {
  console.error(err);
  process.exit(1);
});
