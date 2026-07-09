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
      Notification.requestPermission().catch(() => {});
    }

    return () => unsubscribe();
  }, []);

  const handleConfirmDelivered = async () => {
    if (!robot) return;

    const tableName = getCurrentTable(robot);
    if (!tableName) return;

    try {
      await update(ref(rtdb, ROBOT_ID), {
        [`${tableName}/confirmed`]: true,
        [`${tableName}/status`]: true,
      });
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
    <div className="min-h-screen overflow-hidden bg-[#08111f] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-fuchsia-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 py-6 md:px-8 md:py-8">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.35em] text-cyan-200/80">
              Waiter Tracking Console
            </p>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">{ROBOT_ID}</h1>
          </div>
          <button
            onClick={() => navigate("/robot")}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-100 backdrop-blur transition hover:bg-white/10"
          >
            Back
          </button>
        </header>

        <section className="mb-6 overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-2xl backdrop-blur">
          <div className={`bg-gradient-to-r ${statusMeta.glow} p-6 md:p-8`}>
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className={`mb-4 inline-flex items-center gap-3 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] ${statusMeta.accent}`}>
                  <span className="h-2.5 w-2.5 rounded-full bg-current"></span>
                  {statusMeta.label}
                </div>
                <h2 className="mb-3 text-3xl font-black tracking-tight md:text-4xl">
                  {statusMeta.description}
                </h2>
                <p className="text-sm text-slate-200/80 md:text-base">
                  Current position: {getTableLabel(robot.currentLocation)}. Route data now supports empty and indexed realtime values.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:min-w-[320px]">
                <div className="rounded-[24px] border border-white/10 bg-[#08111f]/40 p-4">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                    Completion
                  </p>
                  <p className="text-3xl font-black tabular-nums">{completion}%</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-[#08111f]/40 p-4">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                    Stops Done
                  </p>
                  <p className="text-3xl font-black tabular-nums">
                    {completedStops}/{totalStops}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-[#08111f]/40 p-5">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                  Trip Status
                </p>
                <p className="text-2xl font-black">{statusMeta.label}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-[#08111f]/40 p-5">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                  Current Location
                </p>
                <p className="text-2xl font-black">{getTableLabel(robot.currentLocation)}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-[#08111f]/40 p-5">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                  Active Route
                </p>
                <p className="text-lg font-black">
                  {robot.route.length ? robot.route.map(getTableLabel).join(" -> ") : "No active stops"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                  Route Timeline
                </p>
                <h3 className="text-2xl font-black tracking-tight">Live stop progress</h3>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-slate-300">
                {robot.route.length ? `${robot.route.length} scheduled stops` : "Standing by"}
              </span>
            </div>

            <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>

            <div className="space-y-4">
              {robot.route.length ? (
                robot.route.map((tableName, index) => {
                  const table = robot.tables[tableName];
                  const stageState = getStageState(robot, tableName, activeStop);
                  const stageClasses = {
                    complete: "border-emerald-400/30 bg-emerald-400/10",
                    active: "border-amber-400/40 bg-amber-400/10",
                    queued: "border-sky-400/30 bg-sky-400/10",
                    inactive: "border-white/10 bg-white/[0.03]",
                  };

                  return (
                    <div
                      key={tableName}
                      className={`rounded-[24px] border p-4 transition-colors ${stageClasses[stageState]}`}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                            Stop {index + 1}
                          </p>
                          <p className="text-xl font-black">{getTableLabel(tableName)}</p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-[#08111f]/50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-slate-200">
                          {stageState}
                        </span>
                      </div>
                      <div className="grid gap-2 text-sm text-slate-200/80 md:grid-cols-4">
                        <p>Mission: {table.mission}</p>
                        <p>Arrived: {table.arrived ? "Yes" : "No"}</p>
                        <p>Confirmed: {table.confirmed ? "Yes" : "No"}</p>
                        <p>Status: {table.status ? "Served" : "Pending"}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-[#08111f]/30 px-5 py-8 text-center text-slate-300">
                  No route is active right now. The console will automatically refresh when new stops are dispatched.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                Action Center
              </p>
              <h3 className="mb-3 text-2xl font-black tracking-tight">Next waiter action</h3>
              <p className="mb-5 text-sm text-slate-300">
                {canConfirm
                  ? `Confirm the drop at ${getTableLabel(currentTable)} so the robot can continue.`
                  : canSendHome
                    ? "All deliveries are complete. Send the robot back to docking."
                    : "Tracking is live. No waiter confirmation is needed at this moment."}
              </p>

              {canConfirm && (
                <button
                  onClick={handleConfirmDelivered}
                  className="mb-3 w-full rounded-[24px] bg-gradient-to-r from-amber-400 to-orange-400 px-5 py-4 text-base font-black text-slate-950 shadow-[0_18px_40px_rgba(251,191,36,0.25)] transition hover:scale-[0.99] active:scale-[0.98]"
                >
                  Confirm Delivered at {getTableLabel(currentTable)}
                </button>
              )}

              {canSendHome && (
                <button
                  onClick={handleSendHome}
                  className="mb-3 w-full rounded-[24px] bg-gradient-to-r from-emerald-300 to-cyan-300 px-5 py-4 text-base font-black text-slate-950 shadow-[0_18px_40px_rgba(52,211,153,0.2)] transition hover:scale-[0.99] active:scale-[0.98]"
                >
                  Send Robot Home
                </button>
              )}

              {!canConfirm && !canSendHome && (
                <div className="rounded-[24px] border border-white/10 bg-[#08111f]/40 p-4 text-sm text-slate-300">
                  Live tracking is active. Waiting for the next robot state.
                </div>
              )}
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                Floor Snapshot
              </p>
              <h3 className="mb-4 text-2xl font-black tracking-tight">All table states</h3>

              <div className="grid gap-3">
                {TABLES.map((tableName) => {
                  const table = robot.tables[tableName];
                  const stageState = getStageState(robot, tableName, activeStop);
                  const classes = {
                    complete: "border-emerald-400/30 bg-emerald-400/10",
                    active: "border-amber-400/40 bg-amber-400/10",
                    queued: "border-sky-400/30 bg-sky-400/10",
                    inactive: "border-white/10 bg-[#08111f]/30",
                  };

                  return (
                    <div key={tableName} className={`rounded-[24px] border p-4 ${classes[stageState]}`}>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-lg font-black">{getTableLabel(tableName)}</p>
                        <span className="rounded-full border border-white/10 bg-[#08111f]/50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-slate-200">
                          {stageState}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                        <p>Mission: {table.mission}</p>
                        <p>Status: {table.status ? "Served" : "Pending"}</p>
                        <p>Arrived: {table.arrived ? "Yes" : "No"}</p>
                        <p>Confirmed: {table.confirmed ? "Yes" : "No"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default RobotTracker;
