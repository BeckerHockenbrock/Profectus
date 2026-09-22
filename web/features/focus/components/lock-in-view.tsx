"use client";

import Image from "next/image";
import { useState } from "react";
import { useLockInStats } from "../hooks/use-lock-in-stats";
import { StoicQuote } from "@/features/quests/components/stoic-quote";

type LockInViewProps = {
  userId?: string | null;
  today: string;
  onStartFocus: (options: {
    targetMinutes: number | null;
    initialBlocks?: number;
  }) => void;
};

const PRESET_BLOCKS = [1, 2, 3, 4] as const;

export function LockInView({ userId, today, onStartFocus }: LockInViewProps) {
  const { sessions, todayStats, streak } = useLockInStats(userId, today);
  const [blockCount, setBlockCount] = useState<number>(1);
  const [isOpenStopwatch, setIsOpenStopwatch] = useState<boolean>(false);

  const handleAddBlock = () => {
    setIsOpenStopwatch(false);
    setBlockCount((prev) => Math.min(12, prev + 1));
  };

  const handleRemoveBlock = () => {
    setIsOpenStopwatch(false);
    setBlockCount((prev) => Math.max(1, prev - 1));
  };

  const handleSelectPreset = (blocks: number) => {
    setIsOpenStopwatch(false);
    setBlockCount(blocks);
  };

  const handleToggleStopwatch = () => {
    setIsOpenStopwatch(true);
  };

  const targetMinutes = isOpenStopwatch ? null : blockCount * 25;

  const handleLaunchFocus = () => {
    onStartFocus({
      targetMinutes,
      initialBlocks: isOpenStopwatch ? undefined : blockCount,
    });
  };

  // Format today's focus time (e.g. "1h 15m" or "45m")
  const formattedTodayTime =
    todayStats.totalMinutes >= 60
      ? `${Math.floor(todayStats.totalMinutes / 60)}h ${todayStats.totalMinutes % 60}m`
      : `${todayStats.totalMinutes}m`;

  const todaySessions = sessions.filter((s) => s.date === today);

  return (
    <div className="lockInContainer" aria-label="General study timer and focus hub">
      {/* Hero section with Sisyphus and daily stoic quote */}
      <section className="hero lockInHero" aria-label="Lock in overview">
        <Image
          className="heroLogo"
          src="/sisyphus.png"
          alt="Sisyphus carrying a boulder"
          width={1152}
          height={1366}
          sizes="(max-width: 48rem) 70vw, 18rem"
          preload
          unoptimized
        />
        <StoicQuote today={today} />
      </section>

      {/* Daily Discipline Stats Overview */}
      <section className="lockInStatsRow" aria-label="Daily discipline metrics">
        <div className="disciplineStatCard">
          <span className="disciplineStatLabel">{"TODAY'S FOCUS"}</span>
          <strong className="disciplineStatValue">{formattedTodayTime}</strong>
          <span className="disciplineStatSub">
            {todayStats.sessionsCount} {todayStats.sessionsCount === 1 ? "session" : "sessions"}
          </span>
        </div>

        <div className="disciplineStatCard">
          <span className="disciplineStatLabel">BLOCKS CONQUERED</span>
          <strong className="disciplineStatValue">
            {todayStats.blocksCompleted} <span className="boulderEmoji" aria-hidden="true">🪨</span>
          </strong>
          <span className="disciplineStatSub">25m study blocks</span>
        </div>

        <div className="disciplineStatCard">
          <span className="disciplineStatLabel">GRIND STREAK</span>
          <strong className="disciplineStatValue">
            {streak} <span className="fireEmoji" aria-hidden="true">🔥</span>
          </strong>
          <span className="disciplineStatSub">
            {streak === 1 ? "1 day active" : `${streak} days in a row`}
          </span>
        </div>
      </section>

      {/* Main Lock In Launcher Card with Stackable Blocks */}
      <section className="lockInLauncherCard" aria-label="Session duration setup">
        <header className="launcherHeader">
          <span className="launcherTag">GENERAL STUDY TIMER</span>
          <h2 className="launcherTitle">Lock In.</h2>
          <p className="launcherDesc">
            Stack your 25-minute blocks, eliminate distractions, and push the boulder.
          </p>
        </header>

        {/* Interactive Block Visualizer */}
        <div className="blockVisualizerSection">
          <div className="blockVisualizerHeader">
            <span className="blockVisualizerCount">
              {isOpenStopwatch ? (
                "Open Stopwatch"
              ) : (
                <>
                  <strong>{blockCount}</strong> {blockCount === 1 ? "Block" : "Blocks"} ·{" "}
                  <strong>{targetMinutes}</strong> Minutes
                </>
              )}
            </span>
            {!isOpenStopwatch ? (
              <span className="blockVisualizerHint">
                {blockCount === 1
                  ? "Standard Pomodoro sprint"
                  : blockCount === 2
                    ? "Classic 50m deep work block"
                    : `${blockCount} unbroken study blocks`}
              </span>
            ) : null}
          </div>

          {!isOpenStopwatch ? (
            <div className="stackedBlocksList" aria-label="Visual stack of study blocks">
              {Array.from({ length: blockCount }).map((_, index) => (
                <div key={index} className="stackedBlockItem" title={`Block ${index + 1}: 25m`}>
                  <span className="blockNumber">{index + 1}</span>
                  <span className="blockDuration">25m</span>
                  <span className="blockIcon" aria-hidden="true">🪨</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="openStopwatchBanner">
              <span className="stopwatchIcon" aria-hidden="true">⏱️</span>
              <p>Continuous study mode. Focus until you decide to push the boulder to the top.</p>
            </div>
          )}

          {/* Block increment / decrement controls */}
          <div className="blockStackControls">
            <button
              type="button"
              className="blockAdjustButton"
              onClick={handleRemoveBlock}
              disabled={isOpenStopwatch || blockCount <= 1}
              aria-label="Remove 25 minute block"
              title="Remove block"
            >
              <span aria-hidden="true">−</span>
              <span>Remove block</span>
            </button>

            <button
              type="button"
              className="blockAdjustButton isPrimary"
              onClick={handleAddBlock}
              disabled={!isOpenStopwatch && blockCount >= 12}
              aria-label="Add 25 minute block"
              title="Add 25m block"
            >
              <span aria-hidden="true">+</span>
              <span>Stack +25m block</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Row */}
        <div className="presetRow" role="group" aria-label="Quick duration presets">
          {PRESET_BLOCKS.map((blocks) => {
            const isSelected = !isOpenStopwatch && blockCount === blocks;
            return (
              <button
                key={blocks}
                type="button"
                className={`presetPill ${isSelected ? "isSelected" : ""}`}
                onClick={() => handleSelectPreset(blocks)}
                aria-pressed={isSelected}
              >
                <strong>{blocks * 25}m</strong>
                <span>{blocks} {blocks === 1 ? "block" : "blocks"}</span>
              </button>
            );
          })}

          <button
            type="button"
            className={`presetPill ${isOpenStopwatch ? "isSelected" : ""}`}
            onClick={handleToggleStopwatch}
            aria-pressed={isOpenStopwatch}
          >
            <strong>Open</strong>
            <span>Stopwatch</span>
          </button>
        </div>

        {/* Big Glowing Lock In Button */}
        <button
          type="button"
          className="lockInLaunchButton"
          onClick={handleLaunchFocus}
          aria-label={
            isOpenStopwatch
              ? "Start open-ended study session"
              : `Lock in for ${targetMinutes} minutes (${blockCount} blocks)`
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
              {isOpenStopwatch ? "Lock In · Open Focus" : `Lock In · ${targetMinutes}m`}
            </span>
          </div>
        </button>
      </section>

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
    </div>
  );
}
