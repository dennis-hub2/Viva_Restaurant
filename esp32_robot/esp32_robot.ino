#include <WiFi.h>
#include <FirebaseESP32.h>

// 1. Provide your Wi-Fi credentials
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// 2. Provide your Firebase credentials
#define FIREBASE_HOST "YOUR_PROJECT_ID-default-rtdb.firebaseio.com" // Without https://
#define FIREBASE_AUTH "YOUR_DATABASE_SECRET" // Or use email/password auth

// Define Firebase Data objects
FirebaseData firebaseData;
FirebaseAuth auth;
FirebaseConfig config;

void setup() {
  Serial.begin(115200);

  // Connect to Wi-Fi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());

  // Configure Firebase
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH; // Using DB Secret for simplicity on device

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Begin streaming on the /orders path
  Serial.println("Starting RTDB stream on /orders...");
  if (!Firebase.beginStream(firebaseData, "/orders")) {
    Serial.println("Could not begin stream");
    Serial.println("REASON: " + firebaseData.errorReason());
  }
}

void loop() {
  // Check if there is new streaming data
  if (Firebase.readStream(firebaseData)) {
    // Check if the stream event is a JSON object
    if (firebaseData.dataType() == "json") {
      FirebaseJson &json = firebaseData.jsonObject();
      FirebaseJsonData jsonData;
      
      // Look for tableNumber in the payload
      json.get(jsonData, "tableNumber");
      
      if (jsonData.success) {
        int tableNumber = jsonData.intValue;
        Serial.print("NEW READY ORDER! Destination Table: ");
        Serial.println(tableNumber);
        
        // --- ADD YOUR ROBOT ACTION HERE ---
        // navigateToTable(tableNumber);
      }
    }
    else if (firebaseData.dataType() == "int") {
        String streamPath = firebaseData.streamPath();
        if(streamPath.indexOf("tableNumber") > 0) {
            int tableNumber = firebaseData.intData();
            Serial.print("Table Number Updated: ");
            Serial.println(tableNumber);
        }
    }
  }

  if (firebaseData.streamTimeout()) {
    Serial.println("Stream timeout, resume streaming...");
  }
}
