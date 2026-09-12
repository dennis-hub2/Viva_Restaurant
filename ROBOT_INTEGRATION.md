# Viva Restaurant Robot Integration

This project uses one shared Realtime Database contract for a single delivery robot (`swagbot1`):

- Backend dispatch logic: [`functions/index.js`](functions/index.js)
- Waiter live tracker: [`src/pages/Waiter/RobotTracker.jsx`](src/pages/Waiter/RobotTracker.jsx)
- Customer order tracker: [`src/Components/ActiveOrderTracker.jsx`](src/Components/ActiveOrderTracker.jsx)
- Admin live ops view: [`src/pages/Admin/tabs/Robots.jsx`](src/pages/Admin/tabs/Robots.jsx)
- Shared schema helpers: [`src/data/robotProtocol.js`](src/data/robotProtocol.js)
- ESP32 robot firmware: [`esp32_robot/esp32_robot.ino`](esp32_robot/esp32_robot.ino)
- RTDB rules: [`database.rules.json`](database.rules.json)

## Physical Layout

There is one robot, `swagbot1`, on a one-direction loop:

`docking -> table1 -> table2 -> table3 -> table4 -> docking`

Important behavior:

- The robot may receive a route that contains only a subset of tables.
- It physically passes non-route tables without stopping.
- It only stops at tables that are in `route` and not bypassed by `home: true`.
- After delivery confirmation, it transitions to the next route stop or returns to docking station.

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

- `idle` / `docking`: robot is docked and available at base.
- `en_route`: robot is actively moving along the loop.
- `waiting_confirmation` / `arrived`: robot is stopped at a destination table, waiting for delivery confirmation.
- `awaiting_return`: all route stops are finished and confirmed; robot is parked, waiting for send-home.
- `returning`: robot is on the way back to the docking station.

## Write Ownership

These ownership boundaries keep system interactions clean:

- **Backend writes only**:
  - `route`
  - `move`
  - `trip_status` (when initializing trip as `"en_route"`)
  - Destination table's initial `mission: "destination"`
- **Robot writes only**:
  - `current_location` (telemetry as robot crosses IR markers)
  - Table `arrived` flag
  - `trip_status` transitions caused by physical movement (`"arrived"`, `"returning"`, `"docking"`)
- **Customer / Waiter app writes**:
  - Table `confirmed: true` and `status: true` when confirming delivery
  - `home: true` (when waiter triggers return)
  - Firestore order status `completed`

## Delivery Confirmation & Route Reset Flow

1. **Customer / Waiter Confirmation**:
   - Both the customer live tracker ([`ActiveOrderTracker.jsx`](src/Components/ActiveOrderTracker.jsx)) and waiter console ([`RobotTracker.jsx`](src/pages/Waiter/RobotTracker.jsx)) track the robot's real-time position using `current_location` exclusively.
   - When the robot reaches the target table (`destination` / `arrived` set to `true` at `current_location`), a **Confirm Delivery** action is displayed.
   - Triggering confirmation writes `swagbot1/tableX/confirmed = true` and updates the corresponding Firestore order status to `completed`.

2. **Route Clearing on Return**:
   - As soon as the robot finishes deliveries and transitions to `"returning"`, `"idle"`, or `"docking"` (or `home === true`), the route array is automatically cleared to `[]` in [`robotProtocol.js`](src/data/robotProtocol.js).
   - This ensures past completed route stops are removed from tracking timelines while returning home.

3. **Docking Reset Behavior**:
   - When the robot arrives back at docking (`current_location: "docking"`):
     - Each route table is reset to `mission: "idle"`, `arrived: false`, `confirmed: false`, `status: false`.
     - Top-level `route` is cleared (`null`/`[]`), `move` set to `false`, `home` set to `false`, and `trip_status` set to `"docking"`.

## ESP32 Firebase Configuration

In [`esp32_robot/esp32_robot.ino`](esp32_robot/esp32_robot.ino):

```cpp
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
#define API_KEY "YOUR_FIREBASE_WEB_API_KEY"
#define DATABASE_URL "viva-restaurant-77588-default-rtdb.firebaseio.com"
```
