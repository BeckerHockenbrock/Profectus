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

// Available block sizes requested: 1, 5, 10 minutes (plus 25m option)
const AVAILABLE_BLOCKS = [1, 5, 10, 25] as const;

export function LockInView({
  userId,
  today,
  onStartFocus,
  onStartBreak,
}: LockInViewProps) {
  const { sessions, todayStats, streak, bankedBreakMinutes } = useLockInStats(userId, today);

  // Stack of block durations in minutes (e.g. [10, 10, 5])
  const [blockStack, setBlockStack] = useState<number[]>([10]);
  const [isOpenStopwatch, setIsOpenStopwatch] = useState<boolean>(false);

  const totalFocusMinutes = blockStack.reduce((sum, b) => sum + b, 0);
  const totalBlocksCount = blockStack.length;
  // 5 minute break required per block (stackable / delayable)
  const earnedBreakMinutes = totalBlocksCount * 5;

  const handleAddBlock = (minutes: number) => {
    setIsOpenStopwatch(false);
    setBlockStack((prev) => (prev.length >= 16 ? prev : [...prev, minutes]));
  };

  const handleRemoveLastBlock = () => {
    setIsOpenStopwatch(false);
    setBlockStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  const handleClearStack = () => {
    setIsOpenStopwatch(false);
    setBlockStack([10]);
  };

  const handleSetPreset = (blocks: number[]) => {
    setIsOpenStopwatch(false);
    setBlockStack(blocks);
  };

  const handleToggleStopwatch = () => {
    setIsOpenStopwatch(true);
  };

  const handleLaunchFocus = () => {
    onStartFocus({
      targetMinutes: isOpenStopwatch ? null : totalFocusMinutes,
      initialBlocks: isOpenStopwatch ? undefined : totalBlocksCount,
    });
  };

  // Format today's focus time (e.g. "1h 15m" or "45m")
  const formattedTodayTime =
    todayStats.totalMinutes >= 60
      ? `${Math.floor(todayStats.totalMinutes / 60)}h ${todayStats.totalMinutes % 60}m`
      : `${todayStats.totalMinutes}m`;

  const todaySessions = sessions.filter((s) => s.date === today);

  return (
    <>
      {/* Hero section with custom Spartan Scholar artwork and dynamic embedded info banner */}
      <section className="hero lockInHero" aria-label="Lock in overview">
        <Image
          className="heroLogo"
          src="/lock-in.png"
          alt="Classical Spartan warrior scholar focused at stone desk"
          width={1024}
          height={1365}
          sizes="(max-width: 48rem) 70vw, 18rem"
          preload
          unoptimized
        />

        {/* Dynamic interactive HUD banner embedded directly inside the hero */}
        <div
          className={`lockInLiveBanner ${todayStats.totalMinutes > 0 ? "isLockedIn" : "isReady"}`}
          role="status"
          aria-live="polite"
        >
          <div className="liveFirePulse" aria-hidden="true">
            <span className="firePulseDot" />
          </div>

          <div className="liveBannerInfo">
            <span className="lockInBannerTag">
              {todayStats.totalMinutes > 0 ? "DISCIPLINE LOG" : "READY TO LOCK IN"}
            </span>
            <strong className="lockInBannerTitle">
              {todayStats.totalMinutes > 0
                ? `${formattedTodayTime} Focused · ${todayStats.blocksCompleted} ${todayStats.blocksCompleted === 1 ? "Block" : "Blocks"}`
                : "No Focus Yet Today"}
            </strong>
            <span className="lockInBannerMeta">
              {streak > 0 ? `🔥 ${streak} Day Streak` : "Start your streak today"}
              {bankedBreakMinutes > 0
                ? ` · ☕ ${bankedBreakMinutes}m Break Banked`
                : " · 5m break per block"}
            </span>
          </div>

          {bankedBreakMinutes > 0 ? (
            <button
              type="button"
              className="bannerTakeBreakBtn"
              onClick={() => onStartBreak(bankedBreakMinutes)}
              title="Take your banked break now"
            >
              ☕ Rest ({bankedBreakMinutes}m)
            </button>
          ) : null}
        </div>
      </section>

      {/* Main Lock In Workspace (Session builder & Today's Study Log) */}
      <section className="lockInWorkspace" aria-label="Study session workspace">
        {/* Main Lock In Controls — Clean, unboxed native flow */}
        <div className="lockInFlowSection" aria-label="Study session builder">
          <header className="lockInSectionHeader">
          <div className="lockInHeaderTitles">
            <span className="lockInSubhead">General Study Timer</span>
            <h2 className="lockInHeading">Lock In.</h2>
          </div>
          <p className="lockInSubtitle">
            Stack your study blocks, push the boulder, and earn a 5-minute break after each block.
          </p>
        </header>

        {/* Banked Break Banner Alert (if user has banked break time) */}
        {bankedBreakMinutes > 0 ? (
          <div className="bankedBreakAlertCard" role="region" aria-label="Earned break reminder">
            <div className="bankedBreakLeft">
              <span className="bankedBreakIcon" aria-hidden="true">☕</span>
              <div>
                <strong>{bankedBreakMinutes} Minutes of Break Banked</strong>
                <p>Earned from your completed study blocks. Rest now or keep grinding.</p>
              </div>
            </div>
            <button
              type="button"
              className="bankedBreakActionBtn"
              onClick={() => onStartBreak(bankedBreakMinutes)}
            >
              Take Break
            </button>
          </div>
        ) : null}

        {/* Block Stacker Section */}
        <div className="blockStackBuilder">
          <div className="stackSummaryRow">
            <div className="stackMetrics">
              {isOpenStopwatch ? (
                <span className="stackTitle">Open-ended Stopwatch</span>
              ) : (
                <>
                  <span className="stackFocusTime">
                    <strong>{totalFocusMinutes}</strong> Minutes Focus
                  </span>
                  <span className="stackSeparator">·</span>
                  <span className="stackBlocksCount">
                    <strong>{totalBlocksCount}</strong> {totalBlocksCount === 1 ? "Block" : "Blocks"}
                  </span>
                </>
              )}
            </div>

            {!isOpenStopwatch ? (
              <span className="stackBreakEarnedBadge" title="5 minute break earned per block">
                ☕ +{earnedBreakMinutes}m Break Earned
              </span>
            ) : null}
          </div>

          {/* Visual Block Stack */}
          {!isOpenStopwatch ? (
            <div className="visualBlockQueue" aria-label="Current stacked blocks">
              {blockStack.map((minutes, index) => (
                <div key={index} className="queueBlockPill">
                  <span className="queueBlockIndex">{index + 1}</span>
                  <span className="queueBlockDuration">{minutes}m</span>
                  <span className="queueBlockIcon" aria-hidden="true">🪨</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="openTimerNotice">
              <span className="openTimerIcon" aria-hidden="true">⏱️</span>
              <p>Continuous stopwatch. Study until you choose to complete your session.</p>
            </div>
          )}

          {/* Stacking Buttons: Smaller Blocks (1m, 5m, 10m) + 25m */}
          <div className="blockAddButtonBar" aria-label="Add study blocks">
            <span className="blockAddLabel">Stack Block:</span>
            <div className="blockAddGroup">
              {AVAILABLE_BLOCKS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  className="addBlockButton"
                  onClick={() => handleAddBlock(mins)}
                  title={`Add a ${mins} minute focus block`}
                >
                  +{mins}m
                </button>
              ))}

              <button
                type="button"
                className="removeBlockButton"
                onClick={handleRemoveLastBlock}
                disabled={isOpenStopwatch || blockStack.length <= 1}
                title="Remove last block from stack"
                aria-label="Remove last block"
              >
                − Remove
              </button>

              <button
                type="button"
                className="clearStackButton"
                onClick={handleClearStack}
                disabled={isOpenStopwatch || blockStack.length <= 1}
                title="Reset stack to 10m block"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="presetsRow" role="group" aria-label="Quick session presets">
            <button
              type="button"
              className={`presetChip ${!isOpenStopwatch && blockStack.length === 1 && blockStack[0] === 5 ? "isActive" : ""}`}
              onClick={() => handleSetPreset([5])}
            >
              5m (1 blk)
            </button>
            <button
              type="button"
              className={`presetChip ${!isOpenStopwatch && blockStack.length === 1 && blockStack[0] === 10 ? "isActive" : ""}`}
              onClick={() => handleSetPreset([10])}
            >
              10m (1 blk)
            </button>
            <button
              type="button"
              className={`presetChip ${!isOpenStopwatch && blockStack.length === 2 && blockStack[0] === 10 && blockStack[1] === 10 ? "isActive" : ""}`}
              onClick={() => handleSetPreset([10, 10])}
            >
              20m (2 blks)
            </button>
            <button
              type="button"
              className={`presetChip ${!isOpenStopwatch && blockStack.length === 3 && blockStack[0] === 10 && blockStack[1] === 10 && blockStack[2] === 10 ? "isActive" : ""}`}
              onClick={() => handleSetPreset([10, 10, 10])}
            >
              30m (3 blks)
            </button>
            <button
              type="button"
              className={`presetChip ${isOpenStopwatch ? "isActive" : ""}`}
              onClick={handleToggleStopwatch}
            >
              Open Stopwatch
            </button>
          </div>
        </div>

        {/* Big Glowing Lock In Button */}
        <button
          type="button"
          className="lockInHeroLaunchButton"
          onClick={handleLaunchFocus}
          aria-label={
            isOpenStopwatch
              ? "Start open-ended study session"
              : `Lock in for ${totalFocusMinutes} minutes across ${totalBlocksCount} blocks`
          }
        >
          <div className="launchButtonGlow" aria-hidden="true" />
          <div className="launchButtonContent">
            <svg
              className="launchIcon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
            <span className="launchTitle">
              {isOpenStopwatch ? "Lock In · Open Focus" : `Lock In · ${totalFocusMinutes}m`}
            </span>
          </div>
        </button>
      </div>

      {/* Today's Study Log */}
      <section className="todayStudyLogSection" aria-label="Today's completed focus sessions">
        <div className="studyLogHeader">
          <span className="studyLogSubhead">History</span>
          <h3 className="studyLogTitle">{"Today's Study Log"}</h3>
        </div>

        {todaySessions.length === 0 ? (
          <div className="studyLogEmptyState">
            <div className="emptyLogIcon" aria-hidden="true">🪨</div>
            <p>No focus blocks completed yet today.</p>
            <span>Stack your blocks above and start your first study session.</span>
          </div>
        ) : (
          <ul className="studyLogList" role="list">
            {todaySessions.map((session) => {
              const date = new Date(session.timestamp);
              const timeStr = date.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              });

              return (
                <li key={session.id} className="studyLogItem">
                  <div className="studyLogIconWrapper" aria-hidden="true">
                    <span>🪨</span>
                  </div>
                  <div className="studyLogInfo">
                    <strong className="studyLogTitleText">
                      {session.durationMinutes} Minutes Focused
                    </strong>
                    <span className="studyLogMeta">
                      {session.blocksCompleted > 0
                        ? `${session.blocksCompleted} ${session.blocksCompleted === 1 ? "block" : "blocks"} completed`
                        : "Open study session"}{" "}
                      · {timeStr}
                    </span>
                  </div>
                  <span className="studyLogXPBadge">+{session.durationMinutes} XP</span>
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
