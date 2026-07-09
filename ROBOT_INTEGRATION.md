# Viva Restaurant Robot Integration

This project now uses one shared Realtime Database contract for a single delivery robot:

- Backend dispatch logic: [functions/index.js](/C:/Users/ForEIgNa/Desktop/Viva_Restaurant/functions/index.js:1)
- Waiter live tracker: [src/pages/Waiter/RobotTracker.jsx](/C:/Users/ForEIgNa/Desktop/Viva_Restaurant/src/pages/Waiter/RobotTracker.jsx:1)
- Admin live ops view: [src/pages/Admin/tabs/Robots.jsx](/C:/Users/ForEIgNa/Desktop/Viva_Restaurant/src/pages/Admin/tabs/Robots.jsx:1)
- Shared schema helpers: [src/data/robotProtocol.js](/C:/Users/ForEIgNa/Desktop/Viva_Restaurant/src/data/robotProtocol.js:1)
- ESP32 robot firmware: [esp32_robot/esp32_robot.ino](/C:/Users/ForEIgNa/Desktop/Viva_Restaurant/esp32_robot/esp32_robot.ino:1)
- RTDB rules: [database.rules.json](/C:/Users/ForEIgNa/Desktop/Viva_Restaurant/database.rules.json:1)

## Physical Layout

There is one robot, `swagbot1`, on a one-direction loop:

`docking -> table1 -> table2 -> table3 -> table4 -> docking`

Important behavior:

- The robot may receive a route that contains only a subset of tables.
- It must physically pass non-route tables without stopping.
- It only stops at tables that are in `route` and not bypassed by `home: true`.
- After the last confirmed delivery, it must stay in place until a waiter explicitly sends it home.

## Realtime Database Shape

The robot lives at the top-level RTDB path `swagbot1`.

```json
{
  "swagbot1": {
    "current_location": "docking",
    "home": false,
    "move": false,
    "route": null,
    "trip_status": "idle",
    "table1": {
      "mission": "idle",
      "status": false,
      "arrived": false,
      "confirmed": false
    },
    "table2": {
      "mission": "idle",
      "status": false,
      "arrived": false,
      "confirmed": false
    },
    "table3": {
      "mission": "idle",
      "status": false,
      "arrived": false,
      "confirmed": false
    },
    "table4": {
      "mission": "idle",
      "status": false,
      "arrived": false,
      "confirmed": false
    }
  }
}
```

## Trip Status Values

- `idle`: robot is docked and available
- `en_route`: robot is actively moving on the loop
- `waiting_confirmation`: robot is stopped at a route table, waiting for waiter confirmation
- `awaiting_return`: all route stops are finished and confirmed; robot is parked, waiting for send-home
- `returning`: waiter has tapped send-home and robot should continue the loop back to docking

## Write Ownership

These ownership boundaries are intentional and should stay strict:

- Backend writes only:
  - `route`
  - `move`
  - `trip_status` only when starting a trip as `"en_route"`
  - each destination table's `mission` and initial `status`
- Robot writes only:
  - `current_location`
  - each table's `arrived`
  - `trip_status` transitions caused by movement:
    - `"waiting_confirmation"`
    - `"en_route"` after waiter confirmation
    - `"awaiting_return"`
    - `"idle"` after docking reset
- Waiter app writes only:
  - each table's `confirmed`
  - each table's `status` when confirming delivery
  - `home`
  - `trip_status` only as `"returning"`

Important note:

- RTDB rules can only enforce this if the waiter app and robot use authenticated non-admin clients.
- Do not use a Realtime Database secret or admin SDK from the robot if you want rules enforcement.

## Backend Flow

The Cloud Functions backend listens for Firestore orders becoming `ready`.

When dispatching:

1. Collect all unassigned ready orders with valid table targets.
2. Convert them into a unique route in physical order:
   - `table1`, `table2`, `table3`, `table4`
3. Start the trip only if `swagbot1` is truly idle.
4. Write:
   - `route: ["table1", "table3"]` or similar
   - `move: true`
   - `trip_status: "en_route"`
   - for each route table:
     - `mission: "destination"`
     - `status: false`
     - `arrived: false`
     - `confirmed: false`

The current backend also retries dispatch when the robot returns to `idle`, so ready orders that arrived while the robot was busy can start automatically on the next trip.

## Robot Flow

The ESP32 firmware listens in real time to:

- `swagbot1/route`
- `swagbot1/home`
- `swagbot1/move`
- `swagbot1/trip_status`
- `swagbot1/current_location`
- `swagbot1/<table>/confirmed`

Robot behavior:

1. While `trip_status` is `en_route` or `returning`, keep line-following active.
2. On each physical table marker:
   - if `home === true`, continue without stopping
   - if the table is not in `route`, continue without stopping
   - otherwise stop and write:
     - `current_location: "<table>"`
     - `<table>/arrived: true`
     - `trip_status: "waiting_confirmation"`
3. While waiting:
   - listen for `<table>/confirmed === true`
4. When confirmed:
   - if this was not the last route stop:
     - write `trip_status: "en_route"`
     - resume line-following
   - if this was the last route stop:
     - write `trip_status: "awaiting_return"`
     - stay stopped
5. When `home === true` and the waiter has set `trip_status: "returning"`:
   - resume following the loop
6. On docking marker:
   - stop
   - reset every route table to idle state
   - clear top-level trip fields back to idle

## Firmware Hook Points

The robot sketch intentionally leaves these functions as hardware stubs:

```cpp
void continueFollowingLine();
void stopRobot();
void onReachTableMarker(const String &tableName);
void onReachDocking();
```

What you need to wire:

- Call `continueFollowingLine()` with your actual motor-forward / line-follow logic.
- Call `stopRobot()` with your motor-stop logic.
- Call `onReachTableMarker("table1")`, `onReachTableMarker("table2")`, and so on when your line or tag sensors detect each table marker.
- Call `onReachDocking()` when the docking marker is detected.

The current firmware file is a control/state shell, not the final motor implementation.

## Waiter App Flow

The waiter tracker page reads directly from `swagbot1`.

UI behavior:

- Always show `trip_status` and `current_location`.
- Show `Confirm Delivered` only when:
  - `trip_status === "waiting_confirmation"`
  - `current_location` is one of `table1` to `table4`
- On confirm, write:
  - `<current_table>/confirmed: true`
  - `<current_table>/status: true`
- Show `Send Robot Home` only when:
  - `trip_status === "awaiting_return"`
- On send-home, write:
  - `home: true`
  - `trip_status: "returning"`

## Dock Reset Behavior

When the robot reaches docking after a return:

- For each table that was in the last route, reset:
  - `mission: "idle"`
  - `status: false`
  - `arrived: false`
  - `confirmed: false`
- Reset top-level state to:

```json
{
  "route": null,
  "trip_status": "idle",
  "move": false,
  "home": false,
  "current_location": "docking"
}
```

## ESP32 Firebase Setup

Update these constants in [esp32_robot/esp32_robot.ino](/C:/Users/ForEIgNa/Desktop/Viva_Restaurant/esp32_robot/esp32_robot.ino:5):

```cpp
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
#define FIREBASE_API_KEY "YOUR_FIREBASE_WEB_API_KEY"
#define FIREBASE_DATABASE_URL "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com"
#define FIREBASE_USER_EMAIL "swagbot1.robot@example.com"
#define FIREBASE_USER_PASSWORD "YOUR_ROBOT_PASSWORD"
```

This robot account should receive a custom claim like:

```json
{ "role": "robot" }
```

## Firebase Setup Checklist

1. Confirm the web app `.env` contains the Firebase web config and `VITE_FIREBASE_DATABASE_URL`.
2. Create a dedicated auth user for the robot.
3. Add custom claims:
   - robot device user: `role = "robot"`
   - waiter-facing app user(s): `role = "waiter"`
   - backend/admin service path: `role = "backend"` when using client credentials
4. Deploy [database.rules.json](/C:/Users/ForEIgNa/Desktop/Viva_Restaurant/database.rules.json:1).
5. Deploy [functions/index.js](/C:/Users/ForEIgNa/Desktop/Viva_Restaurant/functions/index.js:1).
6. Seed `swagbot1` with the idle schema before first run.

## Seed Example

```json
{
  "swagbot1": {
    "current_location": "docking",
    "home": false,
    "move": false,
    "route": null,
    "trip_status": "idle",
    "table1": { "mission": "idle", "status": false, "arrived": false, "confirmed": false },
    "table2": { "mission": "idle", "status": false, "arrived": false, "confirmed": false },
    "table3": { "mission": "idle", "status": false, "arrived": false, "confirmed": false },
    "table4": { "mission": "idle", "status": false, "arrived": false, "confirmed": false }
  }
}
```

## Current Limitations

- The firmware has line-following hook points, but not your real sensor/motor code yet.
- The waiter UI is wired to one robot only: `swagbot1`.
- The rules assume authenticated roles; they do not protect ownership if privileged credentials bypass rules.
