const COMMANDS = {
  IDLE: "IDLE",
  GO_TO_TABLE: "GO_TO_TABLE",
  RETURN_TO_KITCHEN: "RETURN_TO_KITCHEN",
  RESET: "RESET",
};

const STATUSES = {
  DOCKED: "docked",
  DELIVERING: "delivering",
  ARRIVED: "arrived",
  RETURNING: "returning",
  MAINTENANCE: "maintenance",
  OFFLINE: "offline",
};

const DEFAULT_BATTERY = 100;
const ROBOT_ONLINE_WINDOW_MS = 15000;

const nowIso = () => new Date().toISOString();

export { COMMANDS, STATUSES, DEFAULT_BATTERY, ROBOT_ONLINE_WINDOW_MS };

export function buildRobotCommand(command, overrides = {}) {
  return {
    command,
    commandId: overrides.commandId || `${command}-${Date.now()}`,
    commandUpdatedAt: nowIso(),
    ...overrides,
  };
}

export function buildRobotReset() {
  return buildRobotCommand(COMMANDS.RESET, {
    status: STATUSES.DOCKED,
    currentTask: "Docked / Charging",
    currentTable: null,
    destination: null,
    progress: 0,
    currentPath: [],
    lastError: null,
  });
}

export function normalizeRobot(id, robot = {}) {
  const lastSeenAt = robot.lastSeenAt || null;
  const lastSeenMs = lastSeenAt ? Date.parse(lastSeenAt) : Number.NaN;
  const isOnline =
    Number.isFinite(lastSeenMs) &&
    Date.now() - lastSeenMs <= ROBOT_ONLINE_WINDOW_MS;

  return {
    id,
    name: robot.name || "Unit",
    status: robot.status || STATUSES.OFFLINE,
    battery: Number.isFinite(robot.battery) ? robot.battery : DEFAULT_BATTERY,
    health: robot.health || "unknown",
    currentTask: robot.currentTask || "Standby Mode",
    currentTable: robot.currentTable ?? null,
    destination: robot.destination ?? robot.currentTable ?? null,
    progress: Number.isFinite(robot.progress) ? robot.progress : 0,
    command: robot.command || COMMANDS.IDLE,
    commandId: robot.commandId || null,
    currentPath: Array.isArray(robot.currentPath) ? robot.currentPath : [],
    connected: robot.connected ?? isOnline,
    isOnline,
    lastSeenAt,
    lastOrderId: robot.lastOrderId || null,
    firmwareVersion: robot.firmwareVersion || "unknown",
    lastCompletedCommandId: robot.lastCompletedCommandId || null,
    lastCompletedAt: robot.lastCompletedAt || null,
    lastError: robot.lastError || null,
  };
}
