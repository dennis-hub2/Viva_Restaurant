# Viva Restaurant Robot Integration

This project now uses one shared realtime contract between:

- `functions/index.js` for robot dispatch
- `src/pages/Waiter/RobotTracker.jsx` for live waiter tracking
- `src/pages/Admin/tabs/Robots.jsx` for fleet monitoring
- `esp32_robot/esp32_robot.ino` for the ESP32 robot firmware

## Realtime Database Shape

Each robot lives under `robots/{robotId}`.

```json
{
  "robots": {
    "swagbot01": {
      "name": "SwagBot 01",
      "status": "docked",
      "battery": 85,
      "health": "optimal",
      "currentTask": "Docked / Charging",
      "currentTable": 0,
      "destination": 0,
      "progress": 0,
      "command": "IDLE",
      "commandId": "",
      "commandUpdatedAt": "2026-06-22T12:00:00Z",
      "connected": true,
      "firmwareVersion": "v2.0.0",
      "lastSeenAt": "2026-06-22T12:00:00Z",
      "lastOrderId": "",
      "lastCompletedCommandId": "",
      "lastCompletedAt": "",
      "lastError": "",
      "currentPath": []
    }
  }
}
```

## Command Protocol

- `IDLE`: no active mission
- `GO_TO_TABLE`: move from the dock to the assigned table
- `RETURN_TO_KITCHEN`: move from the table back to the dock
- `RESET`: force the robot back to a clean docked state

Every mission command must include a fresh `commandId`. The ESP32 only executes commands it has not completed before, which prevents duplicate runs after reconnects or stream hiccups.

## Status Flow

1. Kitchen marks an order `ready`.
2. Cloud Function finds an online docked robot and writes:
   - `command: GO_TO_TABLE`
   - `commandId: <unique value>`
   - `destination/currentTable: <table number>`
3. ESP32 starts the mission, sends heartbeat updates, and streams progress.
4. On arrival, ESP32 writes:
   - `status: arrived`
   - `command: IDLE`
   - `lastCompletedCommandId`
5. Waiter taps `Food Delivered`.
6. Tracker writes:
   - `command: RETURN_TO_KITCHEN`
   - `commandId: <new unique value>`
7. ESP32 returns to base and finishes in `docked`.

## ESP32 Setup

Update these constants in `esp32_robot/esp32_robot.ino`:

```cpp
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
#define FIREBASE_HOST "YOUR_PROJECT_ID-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "YOUR_DATABASE_SECRET"
#define ROBOT_ID "swagbot01"
#define ROBOT_NAME "SwagBot 01"
```

Install the Arduino libraries used by the sketch:

- `Firebase ESP32 Client`
- `WiFi` (built into ESP32 core)

## Firebase Setup

1. Confirm `.env` contains the web Firebase config, especially `VITE_FIREBASE_DATABASE_URL`.
2. Deploy database rules from `database.rules.json`.
3. Deploy the cloud function in `functions/index.js`.
4. Seed at least one robot node under `robots/swagbot01`.

## Important Behavior

- The web app treats robots as offline if `lastSeenAt` is older than 15 seconds.
- The Cloud Function only dispatches robots that are both `docked` and recently online.
- The tracker now marks finished orders as `completed` so the kitchen UI stays consistent.
- The admin fleet screen shows live online/offline state, last heartbeat time, and reset support.
