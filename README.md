# 🍽️ Viva Restaurant & Autonomous Robot Delivery System

An end-to-end smart restaurant management and autonomous robotic delivery platform powered by **React 19**, **Vite**, **Tailwind CSS v4**, **Firebase** (Firestore, Realtime Database, Cloud Functions), and **ESP32 Microcontroller Firmware**.

[![Live Application](https://img.shields.io/badge/Live%20Demo-Firebase%20Hosting-orange?logo=firebase)](https://viva-restaurant-77588.web.app)
[![React](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.2-purple?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%26%20RTDB-FFCA28?logo=firebase)](https://firebase.google.com/)
[![ESP32](https://img.shields.io/badge/Hardware-ESP32%20IoT-red?logo=espressif)](https://www.espressif.com/)

---

## 📌 Table of Contents

1. [System Overview & Portals](#-system-overview--portals)
2. [User Guide: How to Use the Website](#-user-guide-how-to-use-the-website)
   - [1. Customer Ordering & Tracking Portal (`/`)](#1-customer-ordering--tracking-portal-)
   - [2. Kitchen Display System (KDS) (`/kds`)](#2-kitchen-display-system-kds-kds)
   - [3. Waiter Robot Tracker (`/robot`, `/robot/swagbot1`)](#3-waiter-robot-tracker-robot-robotswagbot1)
   - [4. Administrator Operations Dashboard (`/admin`)](#4-administrator-operations-dashboard-admin)
3. [Interactive Simulation Mode (Testing Without Physical Robot)](#-interactive-simulation-mode-testing-without-physical-robot)
4. [System Architecture](#-system-architecture)
5. [Installation & Setup Guide](#-installation--setup-guide)
6. [Project Structure](#-project-structure)
7. [License](#-license)

---

## 🌐 System Overview & Portals

Viva Restaurant connects the entire dining lifecycle into a single synchronized platform:

| Portal | Route | Primary Users | Key Responsibilities |
| :--- | :--- | :--- | :--- |
| **Customer App** | `/` | Guests & Patrons | Browse menu, customize cart, assign table, checkout, track food live, confirm delivery |
| **Kitchen Display (KDS)** | `/kds` | Chefs & Kitchen Staff | View active tickets, track cooking times, update progress, dispatch delivery robot (`SwagBot1`) |
| **Waiter Console** | `/robot` | Servers & Waitstaff | Monitor robot floor position, view table arrival alerts, confirm handover, send robot home |
| **Admin Dashboard** | `/admin` | Managers & Owners | Sales analytics, menu CRUD, inventory alerts, staff directory, robot telemetry diagnostics |
| **Admin Login** | `/admin/login` | Authorized Staff | Secure authentication portal |

---

## 📖 User Guide: How to Use the Website

### 1. Customer Ordering & Tracking Portal (`/`)

The Customer Portal provides a frictionless digital dining experience directly from dining tables or mobile browsers.

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Browse & Filter ➔ 2. Add to Cart ➔ 3. Choose Table ➔ 4. Live Track │
└────────────────────────────────────────────────────────────────────────┘
```

#### Step 1: Browse Dishes & Filter by Category
- **Category Tabs**: Click on categories at the top (e.g., **All**, **Burgers**, **Pasta**, **Sushi**, **Ramen**, **Soups**, **Mains**, **Desserts**) to quickly view dishes.
- **Search Bar**: Use the search input in the navigation bar to search for any dish by name in real time.
- **Dish Details**: Each card displays the dish name, description, rating, estimated preparation time (e.g., `12 min`), stock status, and price in **Ghanaian Cedis (`₵`)**.

#### Step 2: Add Items to Your Cart
- Click **Add to Cart** on any item.
- If an item is out of stock (`stock = 0`), the button is disabled automatically to prevent overselling.
- A floating badge on the cart icon in the top header updates with your current item count.

#### Step 3: Review Cart & Select Table Number
1. Click the **Cart Icon** in the top navigation bar to open the slide-out Cart Drawer.
2. In the cart drawer, you can:
   - Adjust quantities using `+` and `-`.
   - Remove individual items with the delete icon.
   - Review pricing breakdown: Subtotal, VAT/Taxes, and Total in `₵`.
3. Select your dining table:
   - Use the **Table Dropdown** to select your station (**Table 1**, **Table 2**, **Table 3**, or **Table 4**).
4. Click **Checkout / Confirm Order**.
   - Your order is instantly transmitted to Cloud Firestore and immediately appears on the Kitchen Display System (KDS).
   - An active order token is saved locally to your session so you won't lose your order if you refresh.

#### Step 4: Track Food Delivery in Real Time
As soon as your order is placed, a floating **Live Order Tracker** card docks at the bottom of your screen:
- **5-Stage Progress Stepper**:
  1. `Placed`: Order received and confirmed by the system.
  2. `Cooking`: Chef has started preparing your meal in the kitchen.
  3. `Transit`: SwagBot1 has been loaded and is moving towards your table.
  4. `Arrived`: SwagBot1 has physically stopped at your table!
  5. `Done`: Delivery confirmed and completed.

#### Step 5: Receive Food & Confirm Delivery
- When SwagBot1 arrives at your table, the tracker turns emerald green with the prompt: **"Robot Arrived! 🤖"**.
- Take your food off the robot tray.
- Click **"✓ Confirm Delivery"** on your screen.
- This confirmation signals the robot and waitstaff that you have safely received your order. The tracker will show a completion summary and automatically close.

---

### 2. Kitchen Display System (KDS) (`/kds`)

The Kitchen Display System replaces paper tickets with an interactive digital kanban board for chefs and kitchen expeditors.

#### Navigating the Workstation
- Access `/kds` on a kitchen tablet or monitor.
- The sidebar allows switching between:
  - **Queue**: Active tickets awaiting or currently in preparation.
  - **Cooking**: Focused view of dishes currently on the stove/grill.
  - **Archive**: Completed ticket records.
  - **Logs**: Master tabular ledger of all receipts.

#### Order Progression Lifecycle
1. **New Orders Column**:
   - Tickets arrive in real time with an emerald tag (`NEW ORDER`), table number, and order ID.
   - A live count-up timer displays the exact elapsed minutes and seconds since the ticket was placed.
   - Click **"Start Prep"** when kitchen staff begins cooking. The ticket moves to **In Progress**.
2. **In Progress Column**:
   - Displays tickets currently being prepared.
   - If a ticket exceeds standard cooking latency, visual urgency highlights appear.
   - Click **"Mark Ready"** when all plates are plated and ready for handover. The ticket moves to **Ready**.
3. **Ready Column & Loading the Robot**:
   - The ticket displays the destination table and food items.
   - Kitchen staff places the dishes onto the tray of **SwagBot1** parked at the kitchen docking station.
   - Click **"Assign Robot / Dispatch"**:
     - The system assigns `swagbot1`, calculates the sequential perimeter route, and sets the motor drive status to moving (`move: true`).
     - SwagBot1 departs the kitchen station and begins driving to the designated table.

#### Ticket Inspection & History
- Click on any order card to open the **Order Detail Modal** with itemized ingredients, table number, timestamps, and direct robot assignment overrides.
- Use the **Search Ticket ID** input in the footer to locate any active or completed ticket instantly.

---

### 3. Waiter Robot Tracker (`/robot`, `/robot/swagbot1`)

The Waiter Console allows floor waitstaff to supervise autonomous delivery runs from their smartphones or tablets.

#### Accessing the Floor Tracker
1. Navigate to `/robot`.
2. Enter the robot unit ID (defaults to `swagbot1`) and click **Open Live Tracker** (direct URL: `/robot/swagbot1`).

#### Real-Time Telemetry Map & Status Indicators
- **Header Status Badge**: Shows the robot's active state:
  - `Docked` (Green): Parked at base station awaiting trips.
  - `En Route` (Blue): Actively moving along the dining room track.
  - `Arrived at Table` (Amber): Stopped at a table waiting for customer handover.
  - `Returning` (Purple): Cruising back to kitchen docking base.
- **Dining Floor Map**:
  - Displays the one-way delivery loop: `Docking -> Table 1 -> Table 2 -> Table 3 -> Table 4 -> Docking`.
  - The robot icon updates its position in real time as physical IR sensors cross station markers.
  - Active destination tables are highlighted with glowing badges.

#### Handover Confirmation & Floor Actions
- **Waitstaff Delivery Confirmation**: If a customer does not click confirmation on their phone, the waiter can click **"Confirm Delivery"** directly on the floor console.
- **Send Robot Home**:
  - If deliveries are finished or the floor needs to be cleared, clicking **"Send Robot Home"** instructs SwagBot1 to immediately bypass remaining stops and return to the kitchen docking station.

---

### 4. Administrator Operations Dashboard (`/admin`)

The Admin Dashboard provides management with comprehensive oversight of revenue, menu items, stock, staff, and robotics.

#### Logging In
- Navigate to `/admin/login`.
- Enter the administrative credentials configured in your `.env` file (`VITE_ADMIN_USERNAME` and `VITE_ADMIN_PASSWORD`).
- Upon successful authentication, your secure session is saved and you are redirected to `/admin`.

#### Dashboard Tabs & Operations

| Tab | Features & How to Use |
| :--- | :--- |
| **📊 Overview** | Live shift summary: Total Today's Revenue (in `₵`), Total Orders Placed, Active Occupied Tables, Delivered Count, and real-time incoming ticket feed. |
| **🍽️ Menu Management** | Full catalog control: <br>• **Add Item**: Click "+ Add Dish" to input name, category, price (`₵`), preparation time, stock, and image URL.<br>• **Edit Item**: Click the purple edit button on any dish card to modify pricing, description, or ingredients.<br>• **Delete Item**: Click the delete icon with confirmation guard. |
| **📦 Inventory** | Stock monitoring: View current stock counts for all dishes. Low stock items are flagged with red warnings. Adjust available quantities on the fly. |
| **📈 Sales Analysis** | Financial analytics: Total gross sales, average order value, categorical revenue distribution (Burgers vs. Pasta vs. Sushi, etc.), and sales trend charts. |
| **👥 Staff** | Employee directory: View active waitstaff, chefs, and technicians. Add new staff, modify roles, and assign shifts (Morning, Afternoon, Evening). |
| **🤖 Robots** | Raw robotics diagnostic console: View real-time WebSocket connection to `swagbot1`, motor moving status (`move`), current location, route stops, and individual table milestone flags (`arrived`, `confirmed`). |
| **🕒 Order History** | Searchable archive: Filter historical orders by ticket ID or table number, inspect completed items, and review completion timestamps. |

---

## 🎮 Interactive Simulation Mode (Testing Without Physical Robot)

The platform includes a built-in **Simulation Test Harness** in [`src/firebase.js`](src/firebase.js) that lets anyone test the entire customer-to-kitchen-to-robot workflow directly in the browser without having a physical ESP32 robot connected.

### How to Run the Simulator:
1. Open the website in Google Chrome or Microsoft Edge.
2. Press **F12** (or right-click anywhere and select **Inspect**) and switch to the **Console** tab.
3. You will see the welcome banner:
   ```
   --- ROBOT WORKFLOW SIMULATOR ---
   ```
4. Run the four simulation commands in sequence:

```javascript
// Step 1: Create a ready kitchen order for Table 2
await simulator.createReadyOrder(2);
// Look at your screen: the order is created in Firestore!

// Step 2: Simulate SwagBot1 arriving at Table 2
await simulator.robotArrive(2);
// Look at the Customer Tracker and Waiter Tracker:
// Status updates to "Robot Arrived! 🤖" and the Confirm Delivery button lights up!

// Step 3: Simulate delivery confirmation (customer or waiter confirms receipt)
await simulator.waiterConfirm(2);
// Order is marked completed, and the robot transitions to returning home!

// Step 4: Simulate SwagBot1 arriving back at the kitchen docking station
await simulator.robotDock();
// The robot docks, route is cleared, and state resets to idle!
```

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (WEB)                            │
│  Customer App (/)  │  KDS (/kds)  │  Waiter (/robot)  │  Admin (/admin)│
└────────┬───────────────────┬─────────────────┬────────────────┬────────┘
         │                   │                 │                │
         ▼                   ▼                 ▼                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FIREBASE CLOUD PLATFORM                         │
│                                                                        │
│  Cloud Firestore (Document Database)                                   │
│  ├── `orders`      ➔ Realtime order status lifecycle                   │
│  ├── `menuItems`   ➔ Live catalog, stock, prices in ₵                  │
│  └── `staff`       ➔ Employee records and roles                        │
│                                                                        │
│  Realtime Database (RTDB) (Low-Latency Telemetry)                      │
│  └── `/swagbot1`   ➔ `current_location`, `trip_status`, `move`, `route`│
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ WiFi (WebSocket Stream)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         PHYSICAL ROBOT (SwagBot1)                      │
│  ESP32 Microcontroller  │  BTS7960 Drivers  │  IR Guidance & Sonar     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Installation & Setup Guide

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Firebase Account**: Free Spark plan or higher

### Step 1: Clone the Repository
```bash
git clone https://github.com/dennis-hub2/Viva_Restaurant.git
cd Viva_Restaurant/Viva_Restaurant
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the `Viva_Restaurant/Viva_Restaurant/` directory:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com/
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=your_admin_password
```

### Step 4: Run Local Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Step 5: Production Build
```bash
npm run build
```

---

## 📁 Project Structure

```
Viva_Restaurant/
├── database.rules.json            # Firebase Realtime Database security rules
├── firebase.json                  # Firebase Hosting and Functions configuration
├── ROBOT_INTEGRATION.md           # Detailed robot protocol & telemetry schema
├── README.md                      # Comprehensive website user guide (this file)
│
├── esp32_robot/                   # ESP32 C++ Microcontroller Firmware
│   └── esp32_robot.ino            # Firmware sketch for SwagBot1
│
├── functions/                     # Firebase Cloud Functions (Node.js)
│   ├── index.js                   # Cloud triggers for order dispatching
│   └── package.json               # Functions dependencies
│
├── scripts/                       # Maintenance & Headless Daemons
│   ├── sync_daemon.js             # Standalone state sync daemon
│   ├── deploy_menu_assets.js      # Image asset deployment utility
│   └── inspect_menu.js            # Firestore menu inspector
│
└── src/                           # Frontend React Application
    ├── App.jsx                    # Application master router
    ├── firebase.js                # Firebase SDK initialization & console simulator
    ├── robotDispatch.js           # Multi-stop route planner & sync logic
    ├── main.jsx                   # React DOM root entry
    ├── index.css                  # Global Tailwind CSS styles
    │
    ├── data/                      # Data Models & Shared Protocols
    │   ├── menuData.jsx           # Catalog categories & fallback data
    │   ├── robotNavigation.js     # Simulation coordinate waypoints
    │   └── robotProtocol.js       # Shared RTDB schemas & status enums
    │
    ├── Components/                # Reusable UI Components
    │   ├── ActiveOrderTracker.jsx # Customer live stepper & delivery confirmation
    │   ├── CartDrawer.jsx         # Customer shopping cart & table checkout
    │   ├── MenuCard.jsx           # Food card with stock & ₵ pricing
    │   ├── navbar.jsx             # Header with dish search & cart badge
    │   ├── Hero.jsx               # Landing page hero presentation
    │   ├── CategoryTabs.jsx       # Category filter pills
    │   ├── ContactSection.jsx     # Contact & table booking section
    │   │
    │   └── KDS/                   # Kitchen Display Subcomponents
    │       ├── OrderCard.jsx          # Ticket card with prep timers
    │       ├── OrderDetailModal.jsx   # Expanded ticket detail modal
    │       ├── KitchenArchiveModal.jsx# Completed ticket history modal
    │       ├── KdsHeader.jsx          # Header with system clock
    │       ├── KdsFooter.jsx          # Search bar & ticket counters
    │       ├── KdsReceiptsLog.jsx     # Master receipts ledger
    │       ├── KdsRecentPanel.jsx     # Activity sidebar
    │       └── KdsSidebar.jsx         # View mode navigation rail
    │
    └── pages/                     # Application Page Views
        ├── CustomerHome.jsx       # Customer ordering homepage (`/`)
        ├── KDS/
        │   └── KitchenDisplay.jsx # Kitchen Display System (`/kds`)
        ├── Waiter/
        │   ├── RobotAccess.jsx    # Robot unit selector (`/robot`)
        │   └── RobotTracker.jsx   # Waiter floor telemetry console (`/robot/:id`)
        └── Admin/
            ├── AdminDashboard.jsx # Central admin portal (`/admin`)
            ├── AdminLogin.jsx     # Admin authentication (`/admin/login`)
            ├── components/        # Admin UI (StatCard, Sidebar, LiveOrders, etc.)
            └── tabs/              # Admin tabs (Overview, Menu, Inventory,
                                   # Sales, Staff, Robots, Order History)
```

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
