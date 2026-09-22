"use client";

import Image from "next/image";
import { useState } from "react";
import { useLockInStats } from "../hooks/use-lock-in-stats";

type LockInViewProps = {
  userId?: string | null;
  today: string;
  onStartFocus: (options: {
    targetMinutes: number | null;
    initialBlocks?: number;
  }) => void;
  onStartBreak: (durationMinutes: number) => void;
};

const PRESET_MINUTES = [15, 25, 45, 60] as const;

export function LockInView({
  userId,
  today,
  onStartFocus,
  onStartBreak,
}: LockInViewProps) {
  const { sessions, todayStats, streak, bankedBreakMinutes } = useLockInStats(userId, today);

  const [selectedMinutes, setSelectedMinutes] = useState<number>(25);
  const [isOpenStopwatch, setIsOpenStopwatch] = useState<boolean>(false);

  const calculatedBlocks = Math.max(1, Math.round(selectedMinutes / 25));
  const earnedBreakMinutes = calculatedBlocks * 5;

  const handleSelectPreset = (minutes: number) => {
    setIsOpenStopwatch(false);
    setSelectedMinutes(minutes);
  };

  const handleToggleStopwatch = () => {
    setIsOpenStopwatch(true);
  };

  const handleStepMinutes = (delta: number) => {
    setIsOpenStopwatch(false);
    setSelectedMinutes((prev) => {
      const next = prev + delta;
      return Math.min(180, Math.max(5, next));
    });
  };

  const handleLaunchFocus = () => {
    onStartFocus({
      targetMinutes: isOpenStopwatch ? null : selectedMinutes,
      initialBlocks: isOpenStopwatch ? undefined : calculatedBlocks,
    });
  };

  const formattedTodayTime =
    todayStats.totalMinutes >= 60
      ? `${Math.floor(todayStats.totalMinutes / 60)}h ${todayStats.totalMinutes % 60}m`
      : `${todayStats.totalMinutes}m`;

  const todaySessions = sessions.filter((s) => s.date === today);

  return (
    <>
      {/* Hero section */}
      <section className="hero lockInHero" aria-label="Lock in overview">
        <Image
          className="heroLogo"
          src="/lock-in.png"
          alt="Spartan scholar focused at stone desk"
          width={1024}
          height={1365}
          sizes="(max-width: 48rem) 70vw, 18rem"
          preload
          unoptimized
        />

        {/* Minimal Status Strip */}
        <div className="lockInStatusStrip" role="status" aria-label="Today's study status">
          <div className="statusStripStats">
            <span className="statusStatItem">
              {todayStats.totalMinutes > 0 ? (
                <>
                  <strong>{formattedTodayTime}</strong> focused
                </>
              ) : (
                "Ready to focus"
              )}
            </span>
            <span className="statusStripDivider" aria-hidden="true">
              ·
            </span>
            <span className="statusStatItem">
              {streak > 0 ? `🔥 ${streak}d streak` : "Start streak"}
            </span>
          </div>

          {bankedBreakMinutes > 0 ? (
            <button
              type="button"
              className="statusStripBreakBtn"
              onClick={() => onStartBreak(bankedBreakMinutes)}
              title="Take banked break"
            >
              Rest ({bankedBreakMinutes}m)
            </button>
          ) : null}
        </div>
      </section>

      {/* Main Lock In Workspace */}
      <section className="lockInWorkspace" aria-label="Study session workspace">
        <div className="lockInMainCard">
          {/* Header */}
          <header className="lockInHeader">
            <h2 className="lockInHeading">Lock In</h2>
          </header>

          {/* Minimal Duration Display with Stepper */}
          <div className="lockInTimerSelector">
            <div className="lockInTimeDisplayRow">
              <button
                type="button"
                className="lockInStepBtn"
                onClick={() => handleStepMinutes(-5)}
                disabled={isOpenStopwatch || selectedMinutes <= 5}
                aria-label="Decrease focus time by 5 minutes"
                title="Subtract 5 minutes"
              >
                −
              </button>

              <div className="lockInTimeContent">
                {isOpenStopwatch ? (
                  <>
                    <span className="lockInTimeMain">Stopwatch</span>
                    <span className="lockInTimeSub">Open-ended focus session</span>
                  </>
                ) : (
                  <>
                    <span className="lockInTimeMain">
                      {selectedMinutes}
                      <span className="lockInTimeUnit">m</span>
                    </span>
                    <span className="lockInTimeSub">
                      {calculatedBlocks} {calculatedBlocks === 1 ? "block" : "blocks"} · {earnedBreakMinutes}m break
                    </span>
                  </>
                )}
              </div>

              <button
                type="button"
                className="lockInStepBtn"
                onClick={() => handleStepMinutes(5)}
                disabled={isOpenStopwatch || selectedMinutes >= 180}
                aria-label="Increase focus time by 5 minutes"
                title="Add 5 minutes"
              >
                +
              </button>
            </div>

            {/* Presets Segmented Row */}
            <div className="lockInPresetsRow" role="group" aria-label="Duration presets">
              {PRESET_MINUTES.map((mins) => {
                const isActive = !isOpenStopwatch && selectedMinutes === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    className={`lockInPresetPill ${isActive ? "isActive" : ""}`}
                    onClick={() => handleSelectPreset(mins)}
                  >
                    {mins}m
                  </button>
                );
              })}
              <button
                type="button"
                className={`lockInPresetPill ${isOpenStopwatch ? "isActive" : ""}`}
                onClick={handleToggleStopwatch}
              >
                Open
              </button>
            </div>
          </div>

          {/* Clean Focus Launch CTA */}
          <button
            type="button"
            className="lockInLaunchBtn"
            onClick={handleLaunchFocus}
            aria-label={
              isOpenStopwatch
                ? "Start open-ended study session"
                : `Lock in for ${selectedMinutes} minutes`
            }
          >
            <svg
              className="lockInLaunchIcon"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>{isOpenStopwatch ? "Lock In · Open" : `Lock In · ${selectedMinutes}m`}</span>
          </button>
        </div>

        {/* Today's Study Log */}
        <section className="lockInLogSection" aria-label="Today's completed focus sessions">
          <div className="lockInLogHeader">
            <h3 className="lockInLogTitle">{"Today's Sessions"}</h3>
            {todaySessions.length > 0 ? (
              <span className="lockInLogCount">{todaySessions.length}</span>
            ) : null}
          </div>

          {todaySessions.length === 0 ? (
            <p className="lockInLogEmpty">No sessions completed yet today.</p>
          ) : (
            <ul className="lockInLogList" role="list">
              {todaySessions.map((session) => {
                const date = new Date(session.timestamp);
                const timeStr = date.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                });

                return (
                  <li key={session.id} className="lockInLogItem">
                    <div className="lockInLogItemMain">
                      <strong className="lockInLogItemDuration">
                        {session.durationMinutes}m
                      </strong>
                      <span className="lockInLogItemMeta">
                        {session.blocksCompleted > 0
                          ? `${session.blocksCompleted} ${session.blocksCompleted === 1 ? "block" : "blocks"}`
                          : "Stopwatch"}{" "}
                        · {timeStr}
                      </span>
                    </div>
                    <span className="lockInLogItemXP">+{session.durationMinutes} XP</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </section>
    </>
  );
}
