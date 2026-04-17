# Viva Restaurant: Robot Hardware Integration Guide

This guide provides the JSON schema and protocol for connecting autonomous delivery robots to the Viva Restaurant ecosystem via Firebase Realtime Database (RTDB).

## 📡 Firebase RTDB Structure

The robots communicate through the `robots/` node. Each robot is identified by a unique ID (e.g., `robot_01`).

```json
{
  "robots": {
    "robot_01": {
      "name": "Alpha-1",
      "status": "docked",
      "battery": 85,
      "health": "optimal",
      "currentTask": "Charging",
      "currentTable": null,
      "progress": 0,
      "command": "IDLE",
      "destination": null,
      "lastOrderId": "xyz123"
    }
  }
}
```

## 🛠️ Data Fields Reference

| Field | Type | Description |
| :--- | :--- | :--- |
| `status` | `string` | Current state: `docked`, `delivering`, `arrived`, `returning`, `maintenance` |
| `battery` | `number` | 0 to 100 percentage. |
| `health` | `string` | `optimal`, `warning`, `error`. |
| `currentTask`| `string` | Human-readable task (e.g., "Delivering to Table 5"). |
| `currentTable`| `number` | The table number the robot is currently at or going to. |
| `progress` | `number` | 0 to 100 percentage of the current path completion. |
| `command` | `string` | Instructions from the KDS: `IDLE`, `GO_TO_TABLE`, `RETURN_TO_KITCHEN`. |
| `destination` | `number` | The target table number for the current command. |

## 🤖 Robot Logic Flow

### 1. Waiting for Dispatch (KDS)
The robot should listen for the `command` field to change to `GO_TO_TABLE`.
- **Trigger**: `command === "GO_TO_TABLE"`
- **Action**: 
    1. Read `destination`.
    2. Set `status` to `delivering`.
    3. Start movement to the table.
    4. Update `progress` and `currentTask` in real-time.

### 2. Arrival at Table
Once the robot reaches the coordinates for the `destination`:
- **Action**:
    1. Set `status` to `arrived`.
    2. Set `command` to `IDLE`.
    3. Update `currentTask` to "Waiting for Waiter".
    4. Set `progress` to 100.

### 3. Returning to Kitchen
When the waiter presses "Food Delivered" on the tracker:
- **Trigger**: `status === "returning"` (set by the Web UI).
- **Action**:
    1. Start movement to the kitchen coordinates.
    2. Update `progress` (0 to 100 for the return trip).
    3. Update `currentTask` to "Returning to Kitchen".

### 4. Docking
Once the robot reaches the kitchen/docking station:
- **Action**:
    1. Set `status` to `docked`.
    2. Set `currentTask` to "Docked / Charging".
    3. Reset `progress` to 0.
    4. Reset `currentTable` and `destination` to `null`.

## 💻 Sample Python (Raspberry Pi/ESP32) Snippet

```python
import firebase_admin
from firebase_admin import db

# Initialize Firebase
# ... creds setup ...

def on_command_change(event):
    cmd = event.data
    if cmd == "GO_TO_TABLE":
        dest = db.reference('robots/robot_01/destination').get()
        start_delivery(dest)

db.reference('robots/robot_01/command').listen(on_command_change)

def update_telemetry(progress, battery):
    db.reference('robots/robot_01').update({
        'progress': progress,
        'battery': battery
    })
```
