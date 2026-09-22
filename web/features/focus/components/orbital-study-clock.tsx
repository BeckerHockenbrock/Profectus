"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { formatTimerDigits } from "../domain/timer-format";

export type OrbitalStudyClockProps = {
  /** Remaining or elapsed time in milliseconds */
  displayMs: number;
  /** Target duration in milliseconds (null for open-ended stopwatch) */
  targetMs: number | null;
  /** Whether the session is currently paused */
  isPaused: boolean;
  /** Whether this is a countdown timer or countup stopwatch */
  isCountdown: boolean;
  /** Whether the target has been reached */
  isGoalReached: boolean;
  /** Active block index (1-based, e.g. 1) */
  currentBlock?: number;
  /** Total planned blocks in session (e.g. 4) */
  totalBlocks?: number;
  /** Total focus minutes accumulated today across all sessions */
  todayFocusMinutes?: number;
  /** Daily study goal in minutes (default 240m = 4h) */
  dailyGoalMinutes?: number;
  /** Mode: "focus" for study sessions, "break" for rest sessions */
  mode?: "focus" | "break";
  /** Optional task or quest title */
  taskTitle?: string;
  /** Streak in days */
  streakDays?: number;
};

// Default daily goal: 4 hours (240 minutes)
const DEFAULT_DAILY_GOAL_MINUTES = 240;

export function OrbitalStudyClock({
  displayMs,
  targetMs,
  isPaused,
  isCountdown,
  isGoalReached,
  currentBlock = 1,
  totalBlocks = 4,
  todayFocusMinutes = 0,
  dailyGoalMinutes = DEFAULT_DAILY_GOAL_MINUTES,
  mode = "focus",
  taskTitle,
  streakDays = 0,
}: OrbitalStudyClockProps) {
  const uniqueId = useId().replace(/:/g, "_");
  const [localTime, setLocalTime] = useState<string>("");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  // Smooth angle tracking for 60fps rendering
  const currentAngleRef = useRef<number>(-Math.PI / 2);
  const [renderAngle, setRenderAngle] = useState<number>(-Math.PI / 2);
  const animationFrameRef = useRef<number | null>(null);

  // Track local real-time clock for the HUD telemetry
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLocalTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Motion preference listener
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listener = () => setPrefersReducedMotion(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  // Calculate target progress [0, 1]
  const sessionProgress = useMemo(() => {
    if (!targetMs || targetMs <= 0) {
      // For open-ended stopwatch: 1 full orbit every 25 minutes (1,500,000 ms)
      const loopDuration = 25 * 60 * 1000;
      return (displayMs % loopDuration) / loopDuration;
    }

    if (isCountdown) {
      const elapsed = Math.max(0, targetMs - displayMs);
      return Math.min(1, Math.max(0, elapsed / targetMs));
    }

    return Math.min(1, Math.max(0, displayMs / targetMs));
  }, [displayMs, targetMs, isCountdown]);

  // Target angle in radians (starting from top: -π/2, clockwise)
  const targetAngle = -Math.PI / 2 + sessionProgress * Math.PI * 2;

  // Smooth 60fps spring/lerp interpolation towards target angle
  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    let isRunning = true;
    const animate = () => {
      if (!isRunning) return;

      const diff = targetAngle - currentAngleRef.current;
      // Wrap-around angle correction if jumping over 2π boundary
      let adjustedDiff = diff;
      if (adjustedDiff > Math.PI) adjustedDiff -= Math.PI * 2;
      if (adjustedDiff < -Math.PI) adjustedDiff += Math.PI * 2;

      // Smooth easing
      currentAngleRef.current += adjustedDiff * 0.12;
      setRenderAngle(currentAngleRef.current);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      isRunning = false;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetAngle, prefersReducedMotion]);

  // Derived effective angle (direct targetAngle if reduced motion, otherwise smoothed renderAngle)
  const effectiveAngle = prefersReducedMotion ? targetAngle : renderAngle;

  // Dimensions for astronomical geometry (ViewBox 440 x 440, center at 220, 220)
  const cx = 220;
  const cy = 220;

  // Concentric Radii
  const coreRadius = 78;          // Center Chrono Core
  const orbitRadius = 120;        // Primary Satellite Orbit
  const waypointsRadius = 152;    // Constellation / Pomodoro Blocks Track
  const dailyRadius = 186;        // Outer Daily Horizon Arc

  // Satellite position
  const satX = cx + orbitRadius * Math.cos(effectiveAngle);
  const satY = cy + orbitRadius * Math.sin(effectiveAngle);

  // Daily goal progress arc [0, 1]
  const effectiveDailyMinutes = todayFocusMinutes + Math.floor(displayMs / 60000);
  const dailyProgress = Math.min(1, Math.max(0, effectiveDailyMinutes / dailyGoalMinutes));
  const dailyCircumference = 2 * Math.PI * dailyRadius;
  const dailyStrokeDashoffset = dailyCircumference * (1 - dailyProgress);

  // Session orbit arc (from start -π/2 to current angle)
  const orbitCircumference = 2 * Math.PI * orbitRadius;
  const orbitDashoffset = orbitCircumference * (1 - sessionProgress);

  // Generate Waypoint Nodes along the waypoints ring
  const waypointNodes = useMemo(() => {
    const total = Math.max(1, Math.min(8, totalBlocks));
    const nodes = [];
    for (let i = 0; i < total; i++) {
      // Evenly distribute waypoints starting at top (-π/2)
      const angle = -Math.PI / 2 + (i / total) * Math.PI * 2;
      const x = cx + waypointsRadius * Math.cos(angle);
      const y = cy + waypointsRadius * Math.sin(angle);
      const isCompleted = i + 1 < currentBlock;
      const isCurrent = i + 1 === currentBlock;
      nodes.push({ index: i + 1, x, y, angle, isCompleted, isCurrent });
    }
    return nodes;
  }, [totalBlocks, currentBlock, waypointsRadius, cx, cy]);

  // Color variables according to mode and state
  const isBreak = mode === "break";
  const primaryThemeColor = isBreak
    ? "#22d3ee" // Cyan
    : isGoalReached
      ? "#34d399" // Emerald
      : isPaused
        ? "#94a3b8" // Slate
        : "#f59e0b"; // Solar Amber

  const secondaryThemeColor = isBreak
    ? "#818cf8" // Indigo
    : isGoalReached
      ? "#10b981"
      : isPaused
        ? "#64748b"
        : "#fbbf24"; // Light Amber

  const auraGlowColor = isBreak
    ? "rgba(34, 211, 238, 0.15)"
    : isGoalReached
      ? "rgba(52, 211, 153, 0.22)"
      : isPaused
        ? "rgba(148, 163, 184, 0.08)"
        : "rgba(245, 158, 11, 0.18)";

  // Format daily study stat (e.g. "2h 15m")
  const formattedDailyTime =
    effectiveDailyMinutes >= 60
      ? `${Math.floor(effectiveDailyMinutes / 60)}h ${effectiveDailyMinutes % 60}m`
      : `${effectiveDailyMinutes}m`;

  const formattedDailyGoal =
    dailyGoalMinutes >= 60
      ? `${Math.floor(dailyGoalMinutes / 60)}h`
      : `${dailyGoalMinutes}m`;

  return (
    <div
      className={`orbitalClockRoot ${isBreak ? "isBreakMode" : "isFocusMode"} ${isPaused ? "isPausedState" : ""} ${isGoalReached ? "isGoalReachedState" : ""}`}
      aria-label={`Orbital study clock: ${formatTimerDigits(displayMs)} remaining`}
    >
      {/* Telemetry HUD Top Header */}
      <div className="orbitalHudHeader">
        <div className="orbitalHudPill" title="Local System Time">
          <span className="orbitalPillIcon" aria-hidden="true">⏱</span>
          <span className="orbitalPillLabel">{localTime || "--:--"}</span>
        </div>

        <div className="orbitalHudCenterBadge">
          <span
            className="orbitalPulseBeacon"
            style={{ backgroundColor: primaryThemeColor }}
            aria-hidden="true"
          />
          <span className="orbitalStatusText">
            {isGoalReached
              ? "ORBIT COMPLETE"
              : isPaused
                ? "ORBIT PAUSED"
                : isBreak
                  ? "NEBULA COOL-DOWN"
                  : `MISSION BLOCK ${currentBlock}/${totalBlocks}`}
          </span>
        </div>

        <div className="orbitalHudPill" title="Cumulative focus today towards target">
          <span className="orbitalPillIcon" aria-hidden="true">🎯</span>
          <span className="orbitalPillLabel">
            {formattedDailyTime} / {formattedDailyGoal}
          </span>
        </div>
      </div>

      {/* Main Astronomical SVG Instrument */}
      <div className="orbitalSvgContainer">
        <svg
          className="orbitalSvgCanvas"
          viewBox="0 0 440 440"
          role="img"
          aria-hidden="true"
        >
          <defs>
            {/* Ambient Radial Background Glow */}
            <radialGradient id={`${uniqueId}-coreAura`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={auraGlowColor} />
              <stop offset="60%" stopColor={auraGlowColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>

            {/* Orbit Arc Gradient */}
            <linearGradient id={`${uniqueId}-orbitGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={primaryThemeColor} stopOpacity="0.2" />
              <stop offset="70%" stopColor={secondaryThemeColor} stopOpacity="0.75" />
              <stop offset="100%" stopColor={primaryThemeColor} stopOpacity="1" />
            </linearGradient>

            {/* Outer Daily Arc Gradient */}
            <linearGradient id={`${uniqueId}-dailyGrad`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={secondaryThemeColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={primaryThemeColor} stopOpacity="0.9" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id={`${uniqueId}-glow`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Subtle Star Particle Pattern */}
            <radialGradient id={`${uniqueId}-satGlow`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor={primaryThemeColor} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* Sub-surface Radial Core Aura (Pulsing breath) */}
          <circle
            className="orbitalAuraDisk"
            cx={cx}
            cy={cy}
            r={orbitRadius + 20}
            fill={`url(#${uniqueId}-coreAura)`}
          />

          {/* 1. OUTER RING: Daily Horizon Guide & Progress Arc */}
          <g className="orbitalDailyGroup">
            {/* Track Background */}
            <circle
              cx={cx}
              cy={cy}
              r={dailyRadius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1.2"
              strokeDasharray="2 6"
            />

            {/* Daily Active Progress Arc */}
            {dailyProgress > 0 ? (
              <circle
                cx={cx}
                cy={cy}
                r={dailyRadius}
                fill="none"
                stroke={`url(#${uniqueId}-dailyGrad)`}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={dailyCircumference}
                strokeDashoffset={dailyStrokeDashoffset}
                transform={`rotate(-90 ${cx} ${cy})`}
                style={{
                  transition: "stroke-dashoffset 600ms cubic-bezier(0.2, 0.9, 0.3, 1)",
                }}
              />
            ) : null}

            {/* Daily Milestone Tick Marks (Every 90 degrees / 1 quarter of goal) */}
            {[0, 90, 180, 270].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const x1 = cx + (dailyRadius - 3.5) * Math.cos(rad);
              const y1 = cy + (dailyRadius - 3.5) * Math.sin(rad);
              const x2 = cx + (dailyRadius + 3.5) * Math.cos(rad);
              const y2 = cy + (dailyRadius + 3.5) * Math.sin(rad);
              return (
                <line
                  key={deg}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255, 255, 255, 0.18)"
                  strokeWidth="1"
                />
              );
            })}
          </g>

          {/* 2. MIDDLE RING: Constellation Waypoint Track */}
          <g className="orbitalWaypointsGroup">
            {/* Guide Circle */}
            <circle
              cx={cx}
              cy={cy}
              r={waypointsRadius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.07)"
              strokeWidth="1"
            />

            {/* Waypoint Star Nodes */}
            {waypointNodes.map((node) => {
              return (
                <g key={node.index} className="waypointNodeGroup">
                  {/* Outer pulse halo for current active block */}
                  {node.isCurrent && !isPaused ? (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="9"
                      fill="none"
                      stroke={primaryThemeColor}
                      strokeWidth="1"
                      opacity="0.4"
                      className="waypointActivePulse"
                    />
                  ) : null}

                  {/* Core Star Node */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.isCompleted ? 4.5 : node.isCurrent ? 4 : 2.5}
                    fill={
                      node.isCompleted
                        ? primaryThemeColor
                        : node.isCurrent
                          ? "#ffffff"
                          : "rgba(255, 255, 255, 0.15)"
                    }
                    stroke={node.isCurrent ? primaryThemeColor : "none"}
                    strokeWidth={node.isCurrent ? "1.5" : "0"}
                    filter={node.isCompleted || node.isCurrent ? `url(#${uniqueId}-glow)` : "none"}
                  />
                </g>
              );
            })}
          </g>

          {/* 3. INNER RING: Session Orbital Track & Ionization Trail */}
          <g className="orbitalSessionGroup">
            {/* Orbit Guide Rail */}
            <circle
              cx={cx}
              cy={cy}
              r={orbitRadius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.09)"
              strokeWidth="1.2"
            />

            {/* Elapsed Session Arc (The glowing track behind the satellite) */}
            <circle
              cx={cx}
              cy={cy}
              r={orbitRadius}
              fill="none"
              stroke={`url(#${uniqueId}-orbitGrad)`}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray={orbitCircumference}
              strokeDashoffset={orbitDashoffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              filter={`url(#${uniqueId}-glow)`}
            />

            {/* Orbit Origin Anchor (12 o'clock notch) */}
            <line
              x1={cx}
              y1={cy - orbitRadius - 5}
              x2={cx}
              y2={cy - orbitRadius + 5}
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="1.5"
            />

            {/* Satellite Celestial Pearl (The moving body) */}
            <g
              className="orbitalSatelliteGroup"
              filter={`url(#${uniqueId}-glow)`}
              style={{
                opacity: isPaused ? 0.75 : 1,
              }}
            >
              {/* Outer atmospheric flare */}
              <circle
                cx={satX}
                cy={satY}
                r="10"
                fill={`url(#${uniqueId}-satGlow)`}
                opacity="0.65"
              />

              {/* Core solid celestial body */}
              <circle
                cx={satX}
                cy={satY}
                r="4.2"
                fill="#ffffff"
                stroke={primaryThemeColor}
                strokeWidth="1.5"
              />

              {/* Dynamic shadow crescent (always faces away from core) */}
              <circle
                cx={satX + Math.cos(effectiveAngle) * 1.2}
                cy={satY + Math.sin(effectiveAngle) * 1.2}
                r="3.2"
                fill="rgba(8, 9, 13, 0.65)"
              />
            </g>
          </g>

          {/* 4. CHRONO CORE DISK (Center Instrument Backdrop) */}
          <g className="orbitalChronoCore">
            {/* Core Dark Disk */}
            <circle
              cx={cx}
              cy={cy}
              r={coreRadius}
              fill="rgba(10, 11, 16, 0.88)"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1"
            />

            {/* Inner Precision Ticks */}
            <circle
              cx={cx}
              cy={cy}
              r={coreRadius - 5}
              fill="none"
              stroke="rgba(255, 255, 255, 0.04)"
              strokeWidth="1"
              strokeDasharray="1 5"
            />
          </g>
        </svg>

        {/* Center Digital Telemetry Overlay (HTML inside absolute center for razor-sharp typography) */}
        <div className="orbitalChronoCenterContent">
          <span className="orbitalCenterTag">
            {isBreak ? "REST INTERVAL" : isCountdown ? "TIME REMAINING" : "ELAPSED"}
          </span>

          <div
            className="orbitalTimeDigits"
            aria-live="off"
            style={{
              color: isPaused ? "#94a3b8" : isGoalReached ? "#34d399" : "#f1f1ed",
            }}
          >
            {formatTimerDigits(displayMs)}
          </div>

          <div className="orbitalCycleBadge">
            <span
              className="orbitalDot"
              style={{ backgroundColor: primaryThemeColor }}
              aria-hidden="true"
            />
            <span className="orbitalCycleText">
              {isGoalReached
                ? "SUMMIT REACHED"
                : isPaused
                  ? "PAUSED"
                  : isBreak
                    ? "RECHARGING"
                    : `CYCLE ${currentBlock} OF ${totalBlocks}`}
            </span>
          </div>
        </div>
      </div>

      {/* Telemetry HUD Bottom Footer */}
      <div className="orbitalHudFooter">
        <div className="orbitalHudStatItem">
          <span className="orbitalStatKey">STREAK</span>
          <strong className="orbitalStatVal">
            {streakDays > 0 ? `🔥 ${streakDays}d` : "Day 1"}
          </strong>
        </div>

        {taskTitle ? (
          <div className="orbitalHudTaskPill" title={taskTitle}>
            <span className="orbitalTaskDot" />
            <span className="orbitalTaskTitle">{taskTitle}</span>
          </div>
        ) : null}

        <div className="orbitalHudStatItem">
          <span className="orbitalStatKey">PACE</span>
          <strong className="orbitalStatVal">
            {Math.round(sessionProgress * 100)}%
          </strong>
        </div>
      </div>
    </div>
  );
}
