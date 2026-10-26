/**
 * @file robotProtocol.js
 * @description Academic Specification and Shared Protocol Normalization for Autonomous Robot Delivery.
 * 
 * Thesis Context:
 * This module defines the canonical communication schema, state normalization routines,
 * and domain models governing interactions between the physical ESP32 delivery robot ('swagbot1'),
 * Firebase Realtime Database (RTDB), Kitchen Display System (KDS), Waiter Console, and Customer
 * Live Tracker.
 * 
 * Key Responsibilities:
 * 1. Define invariant constants (robot identifiers, valid table stations, trip status enums).
 * 2. Sanitize and normalize polymorphic route and state representations arriving from RTDB.
 * 3. Enforce deterministic state transitions (e.g. route clearing upon docking/return).
 * 
 * @module data/robotProtocol
 * @author Thesis Research Team
 */

/**
 * Identifier of the primary delivery robot unit in the Realtime Database.
 * @constant {string}
 */
export const ROBOT_ID = "swagbot1";

/**
 * Ordered list of valid physical dining stations (tables) along the line-following perimeter loop.
 * Physical Loop Topology: Docking -> Table 1 -> Table 2 -> Table 3 -> Table 4 -> Docking.
 * @constant {string[]}
 */
export const TABLES = ["table1", "table2", "table3", "table4"];

/**
 * Normalized trip status enumerations reflecting the robot's physical and operational state.
 * @enum {string}
 */
export const TRIP_STATUSES = {
  /** Robot is parked at base station / charging dock */
  IDLE: "docking",
  /** Robot is docked and awaiting dispatch commands */
  DOCKING: "docking",
  /** Robot is actively traversing the line toward a destination table */
  EN_ROUTE: "en_route",
  /** Robot has arrived at the destination table and is holding position */
  ARRIVED: "arrived",
  /** Awaiting delivery confirmation handshake from customer or waitstaff */
  WAITING_CONFIRMATION: "arrived",
  /** All route deliveries confirmed; waiting for return-home dispatch */
  AWAITING_RETURN: "arrived",
  /** Robot is returning to docking base after completing route */
  RETURNING: "returning",
};

/**
 * Factory creating an initial, inactive state schema for an individual table station.
 * 
 * @returns {Object} Fresh table state object
 * @property {string} mission - Operational state ("idle" | "destination")
 * @property {boolean} status - Overall station delivery status flag
 * @property {boolean} arrived - Whether robot has reached this station
 * @property {boolean} confirmed - Whether delivery has been confirmed by customer/staff
 */
export function buildEmptyTableState() {
  return {
    mission: "idle",
    status: false,
    arrived: false,
    confirmed: false,
  };
}

/**
 * Factory creating the complete default idle schema for the robot telemetry node in RTDB.
 * 
 * @param {Object} [overrides={}] - Optional partial fields to override default values
 * @returns {Object} Initialized robot state schema
 */
export function buildIdleRobotState(overrides = {}) {
  return {
    current_location: "docking",
    home: false,
    move: false,
    route: [],
    trip_status: TRIP_STATUSES.DOCKING,
    table1: buildEmptyTableState(),
    table2: buildEmptyTableState(),
    table3: buildEmptyTableState(),
    table4: buildEmptyTableState(),
    ...overrides,
  };
}

/**
 * Helper utility extracting route stops regardless of whether RTDB stored it as an array
 * or as a key-indexed object dictionary (e.g. { "0": "table1", "1": "table3" }).
 * 
 * @private
 * @param {Array|Object|null} route - Raw route value from database
 * @returns {string[]} Array of raw table names
 */
function getRouteValues(route) {
  if (Array.isArray(route)) return route;
  if (!route || typeof route !== "object") return [];

  return Object.entries(route)
    .sort(([leftKey], [rightKey]) => Number(leftKey) - Number(rightKey))
    .map(([, value]) => value);
}

/**
 * Normalizes, deduplicates, and sorts a delivery route in strictly sequential perimeter order.
 * Ensures that multi-table batches execute monotonically without reverse backtracking.
 * 
 * @param {Array|Object|null} route - Raw route input from client or database
 * @returns {string[]} Sorted array of valid, unique table identifiers (e.g. ["table1", "table3"])
 */
export function normalizeRoute(route) {
  return getRouteValues(route)
    .map((value) => String(value).trim().toLowerCase())
    .filter((value, index, array) => TABLES.includes(value) && array.indexOf(value) === index)
    .sort((left, right) => TABLES.indexOf(left) - TABLES.indexOf(right));
}

/**
 * Normalizes an individual table's state node from RTDB, ensuring boolean flags are strict
 * and handling backward-compatible mission field variations.
 * 
 * @param {Object} [table={}] - Raw table sub-document from RTDB
 * @returns {Object} Normalized table state with strict boolean flags
 */
export function normalizeTableState(table = {}) {
  return {
    mission: table.mission || "idle",
    destination: table.destination === true || table.mission === "destination",
    status: table.status === true,
    arrived: table.arrived === true,
    confirmed: table.confirmed === true,
  };
}

/**
 * Normalizes the entire robot telemetry state from RTDB for clean consumption by UI components.
 * Automatically clears stale route arrays if the robot is returning home or docked, preventing
 * ghost stops on tracking visualizations.
 * 
 * @param {Object} [robot={}] - Raw robot telemetry object from RTDB
 * @returns {Object} Standardized, type-safe robot data structure
 */
export function normalizeRobot(robot = {}) {
  const rawStatus = robot.trip_status;
  const isReturningOrIdle =
    rawStatus === "returning" ||
    rawStatus === "idle" ||
    rawStatus === "docking" ||
    robot.home === true;

  // Clear route when returning home or idle so past stops do not remain in tracker
  const route = isReturningOrIdle ? [] : normalizeRoute(robot.route);

  const tables = TABLES.reduce((result, tableName) => {
    result[tableName] = normalizeTableState(robot[tableName]);
    return result;
  }, {});

  const tripStatus =
    rawStatus === "idle" ? TRIP_STATUSES.DOCKING :
      rawStatus === "waiting_confirmation" ? TRIP_STATUSES.ARRIVED :
        rawStatus || TRIP_STATUSES.DOCKING;

  return {
    id: ROBOT_ID,
    currentLocation: robot.current_location || "docking",
    home: robot.home === true,
    move: robot.move === true,
    route,
    tripStatus,
    tables,
  };
}

/**
 * Evaluates whether the robot is currently positioned at a valid dining table.
 * 
 * @param {Object} robot - Normalized robot object
 * @returns {string|null} Table identifier if at a table, or null if docked / in transit
 */
export function getCurrentTable(robot) {
  return TABLES.includes(robot.currentLocation) ? robot.currentLocation : null;
}

/**
 * Finds the current active destination table marked with mission === "destination".
 * 
 * @param {Object} robot - Normalized robot object
 * @returns {string|null} Active destination table identifier, or null
 */
export function getDestinationTable(robot) {
  if (!robot || !robot.tables) return null;
  for (const tableName of TABLES) {
    if (robot.tables[tableName]?.mission === "destination") {
      return tableName;
    }
  }
  return null;
}

/**
 * Converts a programmatic table name (e.g. 'table1') into a human-readable display string ('Table 1').
 * 
 * @param {string} tableName - Programmatic table identifier
 * @returns {string} Formatted display label
 */
export function getTableLabel(tableName) {
  if (!tableName) return "Docking";
  if (!TABLES.includes(tableName)) return tableName;
  return tableName.replace("table", "Table ");
}

/**
 * Checks whether a specified table represents the final delivery stop of the current route.
 * Used to determine whether confirming delivery triggers the next stop or prompts return to docking.
 * 
 * @param {Object} robot - Normalized robot object
 * @param {string} tableName - Table identifier to check
 * @returns {boolean} True if tableName is the terminal stop of the route
 */
export function isLastRouteStop(robot, tableName) {
  return robot.route.length > 0 && robot.route[robot.route.length - 1] === tableName;
}
