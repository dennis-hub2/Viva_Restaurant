# Local Firestore-to-RTDB Sync Daemon

Because you are on the free **Spark Plan**, you cannot deploy Cloud Functions to Firebase. This Node.js script serves as a local background daemon that does the exact same job:
1. Listens for new or updated orders in **Firestore** that are set to `status = "ready"`.
2. Listens for the robot (`swagbot1`) in the **Realtime Database** to become `trip_status = "idle"`.
3. Dispatches orders to the robot by writing the route to the Realtime Database and updating the orders in Firestore.

---

## Setup Instructions

### 1. Download Service Account Key JSON
To let this daemon read and write to your Firebase project, you need a Service Account credentials file:
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. Click the gear icon next to **Project Overview** and select **Project settings**.
4. Navigate to the **Service accounts** tab.
5. Click the **Generate new private key** button at the bottom.
6. A `.json` file will download to your computer.
7. Rename this file to `serviceAccountKey.json` and place it inside the `scripts/` folder (where `sync_daemon.js` resides).

### 2. Install Dependencies
Navigate into the `scripts` directory and install the required dependencies:
```bash
cd scripts
npm install
```

### 3. Run the Daemon
To start the daemon, simply run:
```bash
npm start
```
The script will automatically detect your Firebase configuration from the `.env` file at the root of the project, connect using the service account, and start listening.

---

## Production Deployment (Running 24/7 in background)

To ensure the sync runs 24/7 in the restaurant, it is recommended to run it using a process manager like **PM2**.

### Install PM2 Globally
```bash
npm install -g pm2
```

### Start the Daemon with PM2
Inside the `scripts/` directory, run:
```bash
pm2 start sync_daemon.js --name "viva-restaurant-sync"
```

### Configure PM2 to Start on Boot
To make sure the script runs automatically if the computer restarts:
```bash
pm2 startup
pm2 save
```

To view logs in real-time, run:
```bash
pm2 logs viva-restaurant-sync
```
