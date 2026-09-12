export const ROBOT_ID = "swagbot1";

export const TABLES = ["table1", "table2", "table3", "table4"];

export const TRIP_STATUSES = {
  IDLE: "docking",
  DOCKING: "docking",
  EN_ROUTE: "en_route",
  ARRIVED: "arrived",
  WAITING_CONFIRMATION: "arrived",
  AWAITING_RETURN: "arrived",
  RETURNING: "returning",
};

export function buildEmptyTableState() {
  return {
    mission: "idle",
    status: false,
    arrived: false,
    confirmed: false,
  };
}

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

function getRouteValues(route) {
  if (Array.isArray(route)) return route;
  if (!route || typeof route !== "object") return [];

  return Object.entries(route)
    .sort(([leftKey], [rightKey]) => Number(leftKey) - Number(rightKey))
    .map(([, value]) => value);
}

export function normalizeRoute(route) {
  return getRouteValues(route)
    .map((value) => String(value).trim().toLowerCase())
    .filter((value, index, array) => TABLES.includes(value) && array.indexOf(value) === index)
    .sort((left, right) => TABLES.indexOf(left) - TABLES.indexOf(right));
}

export function normalizeTableState(table = {}) {
  return {
    mission: table.mission || "idle",
    destination: table.destination === true || table.mission === "destination",
    status: table.status === true,
    arrived: table.arrived === true,
    confirmed: table.confirmed === true,
  };
}

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

export function getCurrentTable(robot) {
  return TABLES.includes(robot.currentLocation) ? robot.currentLocation : null;
}

export function getDestinationTable(robot) {
  if (!robot || !robot.tables) return null;
  for (const tableName of TABLES) {
    if (robot.tables[tableName]?.mission === "destination") {
      return tableName;
    }
  }
  return null;
}

export function getTableLabel(tableName) {
  if (!tableName) return "Docking";
  if (!TABLES.includes(tableName)) return tableName;
  return tableName.replace("table", "Table ");
}

export function isLastRouteStop(robot, tableName) {
  return robot.route.length > 0 && robot.route[robot.route.length - 1] === tableName;
}
