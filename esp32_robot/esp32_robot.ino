#include <WiFi.h>
#include <FirebaseESP32.h>

// 1. Provide your Wi-Fi credentials
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// 2. Provide your Firebase credentials
#define FIREBASE_HOST "YOUR_PROJECT_ID-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "YOUR_DATABASE_SECRET"

// Robot Identity
#define ROBOT_ID "robot_01"

// Define Firebase Data objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

void setup() {
  Serial.begin(115200);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println("\nConnected!");

  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Start listening to our specific robot node
  String path = "/robots/" + String(ROBOT_ID);
  if (!Firebase.beginStream(fbdo, path)) {
    Serial.println("Stream error: " + fbdo.errorReason());
  }
}

void loop() {
  if (Firebase.readStream(fbdo)) {
    if (fbdo.dataType() == "json" || fbdo.dataType() == "string") {
      // Check for command updates
      String path = fbdo.dataPath();
      
      // If the whole object was sent or just the command
      if (path == "/command" || path == "/") {
        String command = "";
        if (path == "/command") command = fbdo.stringData();
        else {
           FirebaseJson &json = fbdo.jsonObject();
           FirebaseJsonData data;
           json.get(data, "command");
           if (data.success) command = data.stringValue;
        }

        if (command == "GO_TO_TABLE") {
          handleGoToTable();
        } else if (command == "RETURN_TO_KITCHEN") {
          handleReturnToKitchen();
        }
      }
    }
  }

  if (fbdo.streamTimeout()) {
    Serial.println("Stream timeout, resuming...");
  }
}

void handleGoToTable() {
  // 1. Get destination
  int table = 0;
  String path = "/robots/" + String(ROBOT_ID) + "/destination";
  if (Firebase.getInt(fbdo, path)) {
    table = fbdo.intData();
  }

  Serial.print("DISPATCHED TO TABLE: ");
  Serial.println(table);

  // 2. Simulate Movement
  for (int i = 0; i <= 100; i += 20) {
    updateTelemetry("delivering", i, "Moving to Table " + String(table));
    delay(2000); // Simulate travel time
  }

  // 3. Arrived
  updateTelemetry("arrived", 100, "Waiting for pickup");
  Firebase.setString(fbdo, "/robots/" + String(ROBOT_ID) + "/command", "IDLE");
  Serial.println("ARRIVED AT TABLE");
}

void handleReturnToKitchen() {
  Serial.println("RETURNING TO KITCHEN");
  
  for (int i = 0; i <= 100; i += 25) {
    updateTelemetry("returning", i, "Returning to Kitchen");
    delay(1500);
  }

  updateTelemetry("docked", 0, "Docked / Charging");
  Firebase.setString(fbdo, "/robots/" + String(ROBOT_ID) + "/command", "IDLE");
  Serial.println("DOCKED");
}

void updateTelemetry(String status, int progress, String task) {
  FirebaseJson json;
  json.set("status", status);
  json.set("progress", progress);
  json.set("currentTask", task);
  json.set("battery", 85); // Simulated battery
  
  String path = "/robots/" + String(ROBOT_ID);
  Firebase.updateNode(fbdo, path, json);
}
