# 🍽️ Viva Restaurant & Autonomous Robot Delivery System

An end-to-end modern restaurant management and autonomous delivery platform powered by **React 19**, **Vite**, **Tailwind CSS v4**, **Firebase** (Firestore, Realtime Database, Cloud Functions), and **ESP32 Microcontroller Firmware**.

[![Firebase Hosting](https://img.shields.io/badge/Deploy-Firebase%20Hosting-orange?logo=firebase)](https://viva-restaurant-77588.web.app)
[![React](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.2-purple?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

---

## 🌟 Overview

**Viva Restaurant** is an integrated dining ecosystem designed to automate order flow from table placement to kitchen preparation and autonomous physical food delivery.

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  Customer Web   │       │ Kitchen Display │       │   Waiter & Admin│
│   Order App     │       │  System (KDS)   │       │   Control Ops   │
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │                         │                         │
         ▼                         ▼                         ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                 Firebase Cloud & Database                   │
  │     (Firestore Order Stream + Realtime Database (RTDB))     │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ ESP32 Delivery Robot  │
                     │      (Swagbot1)       │
                     └───────────────────────┘
```

---

## ✨ Key Features

### 🛒 Customer Ordering & Live Tracker
- **Interactive Menu**: Alphabetically sorted, categorized live menu with currency pricing in Ghanaian Cedis (`₵`).
- **Cart & Table Checkout**: Instant table assignment (Tables 1–4) with inventory stock validation.
- **Live Order Stepper**: Multi-stage progress tracking (Placed $\rightarrow$ Cooking $\rightarrow$ Transit $\rightarrow$ Arrived $\rightarrow$ Done).
- **Live Movement Tracking**: Uses realtime telemetry (`current_location`) to show exact robot position as it passes dining stations.
- **On-Screen Delivery Confirmation**: Customers can confirm food arrival directly on their tracking popup when the robot arrives at their table.

### 🤖 Autonomous Robot Dispatch & Telemetry (`swagbot1`)
- **Smart Order Batching**: Multi-stop routing for efficient single-trip batch delivery.
- **Realtime Database Synchronization**: Bi-directional state sync between physical sensors, backend dispatchers, and frontend applications.
- **Auto Route Clearing**: Automatically clears route stops from tracking consoles when returning to docking base.

### 👨‍🍳 Kitchen Display System (KDS)
- Realtime order queue for chefs with order timers, receipt logs, and status transitions (`new` $\rightarrow$ `progress` $\rightarrow$ `ready`).
- Automated trigger signaling backend robot dispatch when dishes are marked ready.

### 📊 Staff & Admin Operations
- **Live Robot Ops Console**: Realtime state view of motor movement, active destinations, station arrival flags, and manual overrides.
- **Waiter Tracking Console**: Staff view for monitoring table arrivals, manual delivery confirmations, and send-home commands.
- **Inventory & Menu Management**: Realtime stock tracking and live dish creation/updates.
- **Sales Analytics & Order History**: Comprehensive revenue breakdown and historical reporting.

---

## 🛠️ Technology Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19, React Router v7 | Core single-page application structure & client-side routing |
| **Build & Tooling** | Vite (Rolldown engine), ESLint | Fast HMR development and optimized production bundling |
| **Styling** | Vanilla CSS, Tailwind CSS v4 | Modern styling, glassmorphism, responsive grid layouts |
| **Database & Auth** | Firebase Firestore, Realtime Database (RTDB) | Document database for orders/menu; RTDB for low-latency robot telemetry |
| **Serverless Logic** | Firebase Cloud Functions | Event-driven order dispatching and background trip automation |
| **Hardware / IoT** | ESP32, Arduino C++ | Microcontroller firmware for line following, IR sensors & ultrasonic obstacle avoidance |

---

## 📁 Project Structure

```
Viva_Restaurant/
├── database.rules.json       # Firebase Realtime Database security rules
├── firebase.json             # Firebase project configuration (Hosting, RTDB, Functions)
├── ROBOT_INTEGRATION.md      # Detailed hardware/software protocol specification
├── esp32_robot/
│   └── esp32_robot.ino       # ESP32 C++ Firmware sketch for Swagbot1
├── functions/
│   └── index.js              # Cloud Functions for automated order dispatching
├── public/                   # Static media assets & icons
└── src/
    ├── App.jsx               # Main React application router
    ├── firebase.js           # Firebase app initialization & SDK exports
    ├── robotDispatch.js      # Client-side robot trip dispatch utilities
    ├── Components/
    │   ├── ActiveOrderTracker.jsx  # Customer live order tracker & delivery confirmation
    │   ├── CartDrawer.jsx          # Shopping cart & checkout drawer
    │   ├── Hero.jsx                # Landing page hero component
    │   ├── MenuCard.jsx            # Food item menu card with ₵ pricing
    │   └── navbar.jsx              # Navigation header
    ├── data/
    │   └── robotProtocol.js  # Shared protocol constants & data normalization logic
    └── pages/
        ├── CustomerHome.jsx        # Customer ordering home page
        ├── Admin/                  # Admin dashboard & management tabs
        ├── KDS/                    # Kitchen Display System
        └── Waiter/                 # Waiter robot tracking consoles
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.x` or higher
- **npm**: `v9.x` or higher
- **Firebase CLI**: `npm install -g firebase-tools`

### Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/dennis-hub2/Viva_Restaurant.git
   cd Viva_Restaurant
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run Local Development Server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 🚢 Deployment

### Production Build
```bash
npm run build
```

### Deploy to Firebase
```bash
# Deploy hosting and database security rules
firebase deploy --only hosting,database
```

---

## 🤖 ESP32 Robot Integration

For full hardware specifications, Realtime Database schema breakdown, write ownership rules, and Arduino setup instructions, refer to the [Robot Integration Protocol Documentation](ROBOT_INTEGRATION.md).

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
