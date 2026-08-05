import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { onValue, ref, update } from "firebase/database";
import { rtdb } from "../../firebase";
import {
  getCurrentTable,
  getTableLabel,
  normalizeRobot,
  ROBOT_ID,
  TABLES,
  TRIP_STATUSES,
  isLastRouteStop,
} from "../../data/robotProtocol";

const tripStatusMeta = {
  [TRIP_STATUSES.IDLE]: {
    label: "Idle",
    accent: "text-emerald-200 border-emerald-400/30 bg-emerald-400/10",
    glow: "from-emerald-400/20 via-emerald-300/10 to-transparent",
    description: "Docked and ready for the next dispatch.",
  },
  [TRIP_STATUSES.EN_ROUTE]: {
    label: "En Route",
    accent: "text-sky-100 border-sky-400/30 bg-sky-400/10",
    glow: "from-sky-400/20 via-sky-300/10 to-transparent",
    description: "Moving through the dining floor now.",
  },
  [TRIP_STATUSES.WAITING_CONFIRMATION]: {
    label: "Waiting Confirmation",
    accent: "text-amber-100 border-amber-400/30 bg-amber-400/10",
    glow: "from-amber-400/20 via-amber-300/10 to-transparent",
    description: "Robot is stopped at a table and waiting for waiter confirmation.",
  },
  [TRIP_STATUSES.AWAITING_RETURN]: {
    label: "Awaiting Return",
    accent: "text-orange-100 border-orange-400/30 bg-orange-400/10",
    glow: "from-orange-400/20 via-orange-300/10 to-transparent",
    description: "All drops are done. Send the robot home when the lane is clear.",
  },
  [TRIP_STATUSES.RETURNING]: {
    label: "Returning",
    accent: "text-cyan-100 border-cyan-400/30 bg-cyan-400/10",
    glow: "from-cyan-400/20 via-cyan-300/10 to-transparent",
    description: "Robot is on the way back to docking.",
  },
};

function formatTripStatus(status) {
  return status.replaceAll("_", " ");
}

function getProgressStats(robot) {
  const totalStops = robot.route.length;
  const completedStops = robot.route.filter((tableName) => robot.tables[tableName]?.confirmed).length;
  const activeStop = getCurrentTable(robot);
  const completion = totalStops === 0 ? (robot.tripStatus === TRIP_STATUSES.IDLE ? 0 : 100) : Math.round((completedStops / totalStops) * 100);

  return {
    totalStops,
    completedStops,
    activeStop,
    completion,
  };
}

function getStageState(robot, tableName, activeStop) {
  const inRoute = robot.route.includes(tableName);
  const table = robot.tables[tableName];

  if (!inRoute) return "inactive";
  if (table.confirmed) return "complete";
  if (activeStop === tableName) return "active";
  if (table.arrived) return "active";
  return "queued";
}

function RobotTracker() {
  const { id = ROBOT_ID } = useParams();
  const navigate = useNavigate();
  const [robot, setRobot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const previousStatusRef = useRef(null);

  useEffect(() => {
    const robotRef = ref(rtdb, ROBOT_ID);

    const unsubscribe = onValue(robotRef, (snapshot) => {
      if (!snapshot.exists()) {
        setRobot(null);
        setIsLoading(false);
        return;
      }

      const nextRobot = normalizeRobot(snapshot.val());
      const currentTable = getCurrentTable(nextRobot);

      if (
        nextRobot.tripStatus === TRIP_STATUSES.WAITING_CONFIRMATION &&
        previousStatusRef.current !== TRIP_STATUSES.WAITING_CONFIRMATION &&
        currentTable
      ) {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Delivery Waiting", {
            body: `Confirm delivery for ${getTableLabel(currentTable)}.`,
            icon: "/vite.svg",
          });
        }
      }

      previousStatusRef.current = nextRobot.tripStatus;
      setRobot(nextRobot);
      setIsLoading(false);
    });

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => { });
    }

    return () => unsubscribe();
  }, []);

  const handleConfirmDelivered = async () => {
    if (!robot) return;

    const tableName = getCurrentTable(robot);
    if (!tableName) return;

    try {
      const isLast = isLastRouteStop(robot, tableName);
      const updates = {
        [`${tableName}/confirmed`]: true,
        [`${tableName}/status`]: true,
      };

      if (isLast) {
        updates.home = true;
        updates.trip_status = TRIP_STATUSES.RETURNING;
      }

      await update(ref(rtdb, ROBOT_ID), updates);
    } catch (error) {
      console.error("Error confirming delivery:", error);
      alert("Failed to confirm delivery. Please try again.");
    }
  };

  const handleSendHome = async () => {
    try {
      await update(ref(rtdb, ROBOT_ID), {
        home: true,
        trip_status: TRIP_STATUSES.RETURNING,
      });
    } catch (error) {
      console.error("Error sending robot home:", error);
      alert("Failed to send the robot home. Please try again.");
    }
  };

  if (id.toLowerCase() !== ROBOT_ID) {
    return (
      <div className="min-h-screen bg-[#08111f] flex flex-col items-center justify-center p-6 text-center text-white">
        <h2 className="text-2xl font-black mb-2">Unsupported Robot ID</h2>
        <p className="text-slate-300 mb-8">This build is currently wired to `{ROBOT_ID}` only.</p>
        <button
          onClick={() => navigate(`/robot/${ROBOT_ID}`)}
          className="rounded-2xl border border-white/10 bg-white/10 px-8 py-3 font-bold backdrop-blur"
        >
          Open {ROBOT_ID}
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#08111f] flex items-center justify-center">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/10 border-t-[#7dd3fc]"></div>
      </div>
    );
  }

  if (!robot) {
    return (
      <div className="min-h-screen bg-[#08111f] flex flex-col items-center justify-center p-6 text-center text-white">
        <h2 className="text-2xl font-black mb-2">Robot Not Found</h2>
        <p className="text-slate-300 mb-8">No realtime data was found for `{ROBOT_ID}`.</p>
        <button
          onClick={() => navigate("/robot")}
          className="rounded-2xl border border-white/10 bg-white/10 px-8 py-3 font-bold backdrop-blur"
        >
          Return
        </button>
      </div>
    );
  }

  const currentTable = getCurrentTable(robot);
  const canConfirm = robot.tripStatus === TRIP_STATUSES.WAITING_CONFIRMATION && currentTable;
  const canSendHome = robot.tripStatus === TRIP_STATUSES.AWAITING_RETURN;
  const statusMeta = tripStatusMeta[robot.tripStatus] || {
    label: formatTripStatus(robot.tripStatus),
    accent: "text-slate-100 border-white/10 bg-white/10",
    glow: "from-white/10 via-white/5 to-transparent",
    description: "Tracking live robot state.",
  };
  const { totalStops, completedStops, activeStop, completion } = getProgressStats(robot);

  return (
    <div className="min-h-screen bg-[#08111f] text-white font-sans relative pb-12 select-none">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-fuchsia-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-md px-4 py-6">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate("/robot")}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition active:scale-95 text-slate-300"
          >
            ←
          </button>
          <div className="text-center">
            <h1 className="text-xl font-black tracking-tight">{ROBOT_ID}</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-400/80">Waiter Tracking Console</p>
          </div>
          <div className="w-10 h-10" /> {/* Spacer */}
        </header>

        {/* Live Status Header Card */}
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${statusMeta.accent}`}>
              <span className="h-2 w-2 rounded-full bg-current animate-pulse"></span>
              {statusMeta.label}
            </div>
            <p className="text-xs font-black text-slate-400">
              {completedStops}/{totalStops} Stops Done
            </p>
          </div>

          <p className="text-sm text-slate-300 mb-4">{statusMeta.description}</p>

          {totalStops > 0 && (
            <div>
              <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                <span>Progress</span>
                <span>{completion}%</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-linear-to-r from-cyan-400 via-sky-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Center - Shown at top priority when user needs to act */}
        {canConfirm && (
          <div className="mb-6 rounded-3xl border-2 border-amber-500/40 bg-amber-500/5 p-5 backdrop-blur shadow-2xl">
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-1">Action Required</p>
            <h3 className="text-lg font-black text-white mb-3">Robot Arrived</h3>
            <p className="text-xs text-slate-300 mb-4">
              {robot.tables[currentTable]?.mission === "pass_through"
                ? `Confirm pass-through at ${getTableLabel(currentTable)} to let the robot resume.`
                : `Confirm food delivery for ${getTableLabel(currentTable)}.`}
            </p>
            <button
              onClick={handleConfirmDelivered}
              className="w-full rounded-2xl bg-linear-to-r from-amber-400 to-orange-400 px-5 py-4 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/25 active:scale-98 transition transform hover:scale-[1.01]"
            >
              {robot.tables[currentTable]?.mission === "pass_through"
                ? `Confirm Pass-through at ${getTableLabel(currentTable)}`
                : `Confirm Delivered at ${getTableLabel(currentTable)}`}
            </button>
          </div>
        )}

        {/* Fallback manual return button */}
        {canSendHome && (
          <div className="mb-6 rounded-3xl border-2 border-emerald-500/40 bg-emerald-500/5 p-5 backdrop-blur shadow-xl text-center">
            <h3 className="text-lg font-black text-white mb-2">Trip Completed</h3>
            <p className="text-xs text-slate-300 mb-4">All delivery stops have been confirmed.</p>
            <button
              onClick={handleSendHome}
              className="w-full rounded-2xl bg-linear-to-r from-emerald-400 to-cyan-400 px-5 py-4 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-98 transition transform hover:scale-[1.01]"
            >
              Send Robot Home
            </button>
          </div>
        )}

        {/* Route Timeline stops progress */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur shadow-xl">
          <h3 className="text-md font-black tracking-tight mb-4 flex items-center justify-between">
            <span>Route Timeline</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-white/5 px-2.5 py-1 rounded-full">
              {robot.route.length ? `${robot.route.length} stops` : "Standby"}
            </span>
          </h3>

          <div className="space-y-3.5">
            {robot.route.length ? (
              robot.route.map((tableName, index) => {
                const table = robot.tables[tableName];
                const stageState = getStageState(robot, tableName, activeStop);

                // Color codes: complete (green), active (amber/waiting), queued (blue)
                const classes = {
                  complete: "border-emerald-500/20 bg-emerald-500/5 text-emerald-300",
                  active: "border-amber-500/20 bg-amber-500/5 text-amber-300",
                  queued: "border-sky-500/20 bg-sky-500/5 text-slate-300",
                  inactive: "border-white/5 bg-white/[0.02] text-slate-500",
                };

                return (
                  <div
                    key={tableName}
                    className={`rounded-2xl border p-4 transition-colors flex items-center justify-between ${classes[stageState]}`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-slate-400">
                          Stop {index + 1}
                        </span>
                        <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-slate-400">
                          {table.mission === "pass_through" ? "Transit" : "Delivery"}
                        </span>
                      </div>
                      <p className="text-md font-black">{getTableLabel(tableName)}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-[#08111f]/60 px-3 py-1 rounded-full border border-white/5">
                        {stageState === "complete"
                          ? (table.mission === "pass_through" ? "Passed" : "Delivered")
                          : stageState === "active"
                            ? (table.arrived ? "At Table" : "En Route")
                            : "Queued"
                        }
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-[#08111f]/20 px-4 py-8 text-center text-xs text-slate-400">
                Robot is idle. Wait for kitchen dispatch.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default RobotTracker;
