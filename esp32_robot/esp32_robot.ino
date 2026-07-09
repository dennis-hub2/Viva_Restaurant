#include <WiFi.h>
#include <FirebaseESP32.h>

// Wi-Fi credentials
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase credentials for a dedicated robot account.
// This account should receive a custom claim such as { role: "robot" }.
#define FIREBASE_API_KEY "YOUR_FIREBASE_WEB_API_KEY"
#define FIREBASE_DATABASE_URL "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com"
#define FIREBASE_USER_EMAIL "swagbot1.robot@example.com"
#define FIREBASE_USER_PASSWORD "YOUR_ROBOT_PASSWORD"

#define ROBOT_PATH "/swagbot1"

FirebaseData streamData;
FirebaseData requestData;
FirebaseAuth auth;
FirebaseConfig config;

const char *TABLES[] = {"table1", "table2", "table3", "table4"};
const size_t TABLE_COUNT = 4;

String routeSequence[TABLE_COUNT];
bool routeTargets[TABLE_COUNT] = {false, false, false, false};
size_t routeLength = 0;

bool homeCommand = false;
bool moveActive = false;
bool waitingForConfirmation = false;
bool awaitingReturn = false;
bool lineFollowingActive = false;
String currentLocation = "docking";
String tripStatus = "idle";
String waitingTable = "";

void continueFollowingLine() {
  lineFollowingActive = true;
  Serial.println("continueFollowingLine() called - add your motor control here.");
}

void stopRobot() {
  lineFollowingActive = false;
  Serial.println("stopRobot() called - add your motor stop logic here.");
}

void beginLineFollowingIfNeeded() {
  if (!lineFollowingActive) {
    continueFollowingLine();
  }
}

void connectToWifi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");

  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }

  Serial.println();
  Serial.println("Wi-Fi connected");
}

int tableIndex(const String &tableName) {
  for (size_t index = 0; index < TABLE_COUNT; index++) {
    if (tableName == TABLES[index]) {
      return (int)index;
    }
  }

  return -1;
}

bool isKnownTable(const String &tableName) {
  return tableIndex(tableName) >= 0;
}

bool isTableInRoute(const String &tableName) {
  int index = tableIndex(tableName);
  return index >= 0 && routeTargets[index];
}

bool isLastRouteStop(const String &tableName) {
  return routeLength > 0 && routeSequence[routeLength - 1] == tableName;
}

String tablePath(const String &tableName) {
  return String(ROBOT_PATH) + "/" + tableName;
}

void clearRoute() {
  routeLength = 0;
  for (size_t index = 0; index < TABLE_COUNT; index++) {
    routeSequence[index] = "";
    routeTargets[index] = false;
  }
}

bool writeTopLevelState(const String &location, const String &nextTripStatus) {
  FirebaseJson json;
  json.set("current_location", location);
  json.set("trip_status", nextTripStatus);

  if (!Firebase.updateNode(requestData, ROBOT_PATH, json)) {
    Serial.println("Top-level state update failed: " + requestData.errorReason());
    return false;
  }

  currentLocation = location;
  tripStatus = nextTripStatus;
  return true;
}

bool writeArrivedState(const String &tableName) {
  FirebaseJson json;
  json.set("current_location", tableName);
  json.set("trip_status", "waiting_confirmation");
  json.set(tableName + "/arrived", true);

  if (!Firebase.updateNode(requestData, ROBOT_PATH, json)) {
    Serial.println("Arrival update failed: " + requestData.errorReason());
    return false;
  }

  currentLocation = tableName;
  tripStatus = "waiting_confirmation";
  return true;
}

bool isTableConfirmed(const String &tableName) {
  String path = tablePath(tableName) + "/confirmed";
  if (!Firebase.getBool(requestData, path)) {
    Serial.println("Confirm read failed: " + requestData.errorReason());
    return false;
  }

  return requestData.boolData();
}

void syncMotionToTripState() {
  if (!moveActive) {
    stopRobot();
    return;
  }

  if (tripStatus == "waiting_confirmation" || tripStatus == "awaiting_return") {
    stopRobot();
    return;
  }

  if (tripStatus == "en_route" || tripStatus == "returning") {
    beginLineFollowingIfNeeded();
  }
}

void refreshRouteFromDatabase() {
  clearRoute();

  if (!Firebase.getArray(requestData, String(ROBOT_PATH) + "/route")) {
    if (requestData.dataType() == "null") {
      return;
    }

    Serial.println("Route unavailable or read failed: " + requestData.errorReason());
    return;
  }

  FirebaseJsonArray &array = requestData.jsonArray();
  size_t count = array.size();

  for (size_t index = 0; index < count && routeLength < TABLE_COUNT; index++) {
    FirebaseJsonData value;
    array.get(value, index);
    String tableName = value.stringValue;

    int tableIdx = tableIndex(tableName);
    if (tableIdx >= 0 && !routeTargets[tableIdx]) {
      routeTargets[tableIdx] = true;
      routeSequence[routeLength++] = tableName;
    }
  }
}

void refreshRobotState() {
  if (Firebase.getBool(requestData, String(ROBOT_PATH) + "/home")) {
    homeCommand = requestData.boolData();
  }

  if (Firebase.getBool(requestData, String(ROBOT_PATH) + "/move")) {
    moveActive = requestData.boolData();
  }

  if (Firebase.getString(requestData, String(ROBOT_PATH) + "/trip_status")) {
    tripStatus = requestData.stringData();
  }

  if (Firebase.getString(requestData, String(ROBOT_PATH) + "/current_location")) {
    currentLocation = requestData.stringData();
  }

  refreshRouteFromDatabase();

  waitingForConfirmation = tripStatus == "waiting_confirmation";
  awaitingReturn = tripStatus == "awaiting_return";
  if (waitingForConfirmation && isKnownTable(currentLocation)) {
    waitingTable = currentLocation;
  }

  if (waitingForConfirmation && waitingTable.length() > 0 && isTableConfirmed(waitingTable)) {
    if (isLastRouteStop(waitingTable)) {
      stopRobot();
      writeTopLevelState(waitingTable, "awaiting_return");
      waitingForConfirmation = false;
      awaitingReturn = true;
      waitingTable = "";
    } else {
      writeTopLevelState(waitingTable, "en_route");
      waitingForConfirmation = false;
      awaitingReturn = false;
      waitingTable = "";
      beginLineFollowingIfNeeded();
    }
  }

  syncMotionToTripState();
}

void beginRobotStream() {
  if (!Firebase.beginStream(streamData, ROBOT_PATH)) {
    Serial.println("Stream start failed: " + streamData.errorReason());
  } else {
    Serial.println("Listening on " + String(ROBOT_PATH));
  }
}

void listenForStateChanges() {
  if (!Firebase.readStream(streamData)) {
    if (streamData.streamTimeout()) {
      return;
    }

    Serial.println("Stream read failed: " + streamData.errorReason());
    beginRobotStream();
    return;
  }

  if (!streamData.streamAvailable()) {
    return;
  }

  refreshRobotState();
}

void onReachTableMarker(const String &tableName) {
  if (!isKnownTable(tableName)) {
    Serial.println("Ignoring unknown table marker: " + tableName);
    return;
  }

  Serial.println("Reached marker for " + tableName);

  if (homeCommand || !isTableInRoute(tableName)) {
    writeTopLevelState(tableName, tripStatus);
    beginLineFollowingIfNeeded();
    return;
  }

  stopRobot();
  waitingTable = tableName;
  waitingForConfirmation = true;
  awaitingReturn = false;
  writeArrivedState(tableName);
}

void resetVisitedRouteState() {
  FirebaseJson json;

  for (size_t index = 0; index < routeLength; index++) {
    String tableName = routeSequence[index];
    json.set(tableName + "/mission", "idle");
    json.set(tableName + "/status", false);
    json.set(tableName + "/arrived", false);
    json.set(tableName + "/confirmed", false);
  }

  json.set("trip_status", "idle");
  json.set("move", false);
  json.set("home", false);
  json.set("current_location", "docking");

  if (!Firebase.updateNode(requestData, ROBOT_PATH, json)) {
    Serial.println("Dock reset failed: " + requestData.errorReason());
    return;
  }

  if (!Firebase.deleteNode(requestData, String(ROBOT_PATH) + "/route")) {
    Serial.println("Route clear failed: " + requestData.errorReason());
  }

  clearRoute();
  homeCommand = false;
  moveActive = false;
  waitingForConfirmation = false;
  awaitingReturn = false;
  waitingTable = "";
  currentLocation = "docking";
  tripStatus = "idle";
}

void onReachDocking() {
  Serial.println("Reached docking marker");
  stopRobot();
  resetVisitedRouteState();
}

void setup() {
  Serial.begin(115200);
  connectToWifi();

  config.api_key = FIREBASE_API_KEY;
  config.database_url = FIREBASE_DATABASE_URL;
  auth.user.email = FIREBASE_USER_EMAIL;
  auth.user.password = FIREBASE_USER_PASSWORD;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  beginRobotStream();
  refreshRobotState();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWifi();
    beginRobotStream();
  }

  listenForStateChanges();

  // Call onReachTableMarker("table1"), ..., or onReachDocking() from your
  // line-sensor / marker-detection code when the robot physically hits a marker.
}
