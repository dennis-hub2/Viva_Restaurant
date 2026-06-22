#include <WiFi.h>
#include <FirebaseESP32.h>
#include <time.h>

// Wi-Fi credentials
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase Realtime Database credentials
#define FIREBASE_HOST "YOUR_PROJECT_ID-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "YOUR_DATABASE_SECRET"

// Robot identity
#define ROBOT_ID "swagbot01"
#define ROBOT_NAME "SwagBot 01"
#define FIRMWARE_VERSION "v2.0.0"

// Timing
const unsigned long HEARTBEAT_INTERVAL_MS = 5000;
const unsigned long PROGRESS_INTERVAL_MS = 1000;
const unsigned long DELIVERY_DURATION_MS = 20000;
const unsigned long RETURN_DURATION_MS = 15000;

FirebaseData streamData;
FirebaseData requestData;
FirebaseAuth auth;
FirebaseConfig config;

struct MissionState {
  bool active;
  String command;
  String commandId;
  int destination;
  unsigned long startedAt;
  unsigned long lastProgressUpdateAt;
  unsigned long durationMs;
  int progress;
};

MissionState mission = {false, "IDLE", "", 0, 0, 0, 0, 0};
unsigned long lastHeartbeatAt = 0;

String robotPath() {
  return "/robots/" + String(ROBOT_ID);
}

String isoTimestamp() {
  struct tm timeInfo;
  if (!getLocalTime(&timeInfo, 50)) {
    return "";
  }

  char buffer[25];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeInfo);
  return String(buffer);
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

void syncTime() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.print("Syncing clock");

  for (int attempt = 0; attempt < 20; attempt++) {
    String stamp = isoTimestamp();
    if (stamp.length() > 0) {
      Serial.println();
      Serial.println("Clock synced: " + stamp);
      return;
    }

    Serial.print(".");
    delay(250);
  }

  Serial.println();
  Serial.println("Clock sync skipped, timestamps may be blank");
}

void beginRobotStream() {
  if (!Firebase.beginStream(streamData, robotPath())) {
    Serial.println("Stream start failed: " + streamData.errorReason());
  } else {
    Serial.println("Listening on " + robotPath());
  }
}

bool getStringField(FirebaseJson &json, const char *key, String &output) {
  FirebaseJsonData data;
  json.get(data, key);
  if (!data.success) return false;
  output = data.stringValue;
  return true;
}

bool getIntField(FirebaseJson &json, const char *key, int &output) {
  FirebaseJsonData data;
  json.get(data, key);
  if (!data.success) return false;
  output = data.intValue;
  return true;
}

void updateRobotState(
  const String &status,
  int progress,
  const String &task,
  int currentTable,
  const String &command,
  const String &commandId,
  const String &lastCompletedCommandId,
  const String &lastError
) {
  FirebaseJson json;
  String stamp = isoTimestamp();

  json.set("name", ROBOT_NAME);
  json.set("status", status);
  json.set("progress", progress);
  json.set("currentTask", task);
  json.set("battery", 85);
  json.set("health", "optimal");
  json.set("currentTable", currentTable);
  json.set("destination", currentTable);
  json.set("command", command);
  json.set("commandId", commandId);
  json.set("connected", true);
  json.set("firmwareVersion", FIRMWARE_VERSION);

  if (stamp.length() > 0) {
    json.set("lastSeenAt", stamp);
    json.set("commandUpdatedAt", stamp);
    if (lastCompletedCommandId.length() > 0) {
      json.set("lastCompletedAt", stamp);
    }
  }

  if (lastCompletedCommandId.length() > 0) {
    json.set("lastCompletedCommandId", lastCompletedCommandId);
  }

  if (lastError.length() > 0) {
    json.set("lastError", lastError);
  } else {
    json.set("lastError", "");
  }

  if (!Firebase.updateNode(requestData, robotPath(), json)) {
    Serial.println("State update failed: " + requestData.errorReason());
  }
}

void sendHeartbeat() {
  FirebaseJson json;
  String stamp = isoTimestamp();

  json.set("name", ROBOT_NAME);
  json.set("connected", true);
  json.set("battery", 85);
  json.set("health", "optimal");
  json.set("firmwareVersion", FIRMWARE_VERSION);

  if (stamp.length() > 0) {
    json.set("lastSeenAt", stamp);
  }

  if (!Firebase.updateNode(requestData, robotPath(), json)) {
    Serial.println("Heartbeat failed: " + requestData.errorReason());
  }
}

void resetMission(bool keepDockedState) {
  mission.active = false;
  mission.command = "IDLE";
  mission.commandId = "";
  mission.destination = 0;
  mission.startedAt = 0;
  mission.lastProgressUpdateAt = 0;
  mission.durationMs = 0;
  mission.progress = 0;

  updateRobotState(
    "docked",
    0,
    keepDockedState ? "Docked / Charging" : "Ready for next mission",
    0,
    "IDLE",
    "",
    "",
    ""
  );
}

void startMission(const String &command, const String &commandId, int destination) {
  mission.active = true;
  mission.command = command;
  mission.commandId = commandId;
  mission.destination = destination;
  mission.startedAt = millis();
  mission.lastProgressUpdateAt = 0;
  mission.progress = 0;
  mission.durationMs =
    command == "GO_TO_TABLE" ? DELIVERY_DURATION_MS : RETURN_DURATION_MS;

  if (command == "GO_TO_TABLE") {
    Serial.println("Dispatch received for table " + String(destination));
    updateRobotState(
      "delivering",
      0,
      "Delivering to Table " + String(destination),
      destination,
      command,
      commandId,
      "",
      ""
    );
  } else if (command == "RETURN_TO_KITCHEN") {
    Serial.println("Return-to-kitchen command received");
    updateRobotState(
      "returning",
      0,
      "Returning to Kitchen",
      destination,
      command,
      commandId,
      "",
      ""
    );
  }
}

void completeMission() {
  if (!mission.active) return;

  if (mission.command == "GO_TO_TABLE") {
    Serial.println("Robot arrived at table");
    updateRobotState(
      "arrived",
      100,
      "Waiting for Waiter",
      mission.destination,
      "IDLE",
      "",
      mission.commandId,
      ""
    );
  } else {
    Serial.println("Robot docked");
    updateRobotState(
      "docked",
      0,
      "Docked / Charging",
      0,
      "IDLE",
      "",
      mission.commandId,
      ""
    );
  }

  mission.active = false;
  mission.command = "IDLE";
  mission.commandId = "";
}

void tickMission() {
  if (!mission.active) return;
  if (millis() - mission.lastProgressUpdateAt < PROGRESS_INTERVAL_MS) return;

  mission.lastProgressUpdateAt = millis();

  unsigned long elapsed = millis() - mission.startedAt;
  int nextProgress = (int)((elapsed * 100UL) / mission.durationMs);
  if (nextProgress > 100) nextProgress = 100;
  if (nextProgress < mission.progress) nextProgress = mission.progress;

  if (nextProgress == mission.progress && nextProgress < 100) {
    nextProgress = mission.progress + 5;
  }

  if (nextProgress > 100) nextProgress = 100;
  mission.progress = nextProgress;

  String task = mission.command == "GO_TO_TABLE"
    ? "Delivering to Table " + String(mission.destination)
    : "Returning to Kitchen";

  updateRobotState(
    mission.command == "GO_TO_TABLE" ? "delivering" : "returning",
    mission.progress,
    task,
    mission.destination,
    mission.command,
    mission.commandId,
    "",
    ""
  );

  if (mission.progress >= 100) {
    completeMission();
  }
}

void processCommandPayload(FirebaseJson &json) {
  String command = "IDLE";
  String commandId = "";
  int destination = 0;

  getStringField(json, "command", command);
  getStringField(json, "commandId", commandId);
  getIntField(json, "destination", destination);

  if (command == "IDLE" || commandId.length() == 0) return;
  if (mission.active && mission.commandId == commandId) return;

  String completedCommandId = "";
  getStringField(json, "lastCompletedCommandId", completedCommandId);
  if (completedCommandId == commandId) return;

  if (command == "RESET") {
    Serial.println("Reset command received");
    resetMission(true);
    return;
  }

  if (command == "GO_TO_TABLE") {
    startMission(command, commandId, destination);
    return;
  }

  if (command == "RETURN_TO_KITCHEN") {
    startMission(command, commandId, destination);
    return;
  }
}

void listenForCommands() {
  if (!Firebase.readStream(streamData)) {
    if (streamData.streamTimeout()) {
      Serial.println("Stream timeout, continuing");
      return;
    }

    Serial.println("Stream read failed: " + streamData.errorReason());
    beginRobotStream();
    return;
  }

  if (!streamData.streamAvailable()) return;

  String path = streamData.dataPath();
  if (streamData.dataType() == "json") {
    FirebaseJson &json = streamData.jsonObject();
    processCommandPayload(json);
    return;
  }

  if (path == "/command" || path == "/commandId") {
    if (Firebase.getJSON(requestData, robotPath())) {
      FirebaseJson &json = requestData.jsonObject();
      processCommandPayload(json);
    } else {
      Serial.println("Failed to refresh robot node: " + requestData.errorReason());
    }
  }
}

void setup() {
  Serial.begin(115200);
  connectToWifi();
  syncTime();

  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  beginRobotStream();

  updateRobotState(
    "docked",
    0,
    "Docked / Charging",
    0,
    "IDLE",
    "",
    "",
    ""
  );
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWifi();
    beginRobotStream();
  }

  listenForCommands();
  tickMission();

  if (millis() - lastHeartbeatAt >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatAt = millis();
    sendHeartbeat();
  }
}
