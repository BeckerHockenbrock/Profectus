"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
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

const STONE_MINUTES = [5, 10, 25] as const;
const MAX_FOCUS_MINUTES = 180;
const VISIBLE_STONES = 7;

type FocusStone = { id: number; minutes: number };
type StoneDrag = { minutes: number; pointerId: number; startX: number; startY: number; moved: boolean };

export function LockInView({
  userId,
  today,
  onStartFocus,
  onStartBreak,
}: LockInViewProps) {
  const { sessions, todayStats, streak, bankedBreakMinutes } = useLockInStats(userId, today);

  const [stones, setStones] = useState<FocusStone[]>([{ id: 1, minutes: 25 }]);
  const [isOpenStopwatch, setIsOpenStopwatch] = useState<boolean>(false);
  const [dragPreview, setDragPreview] = useState<{ minutes: number; x: number; y: number; overScene: boolean } | null>(null);
  const nextStoneId = useRef(2);
  const sceneRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const firstChoiceRef = useRef<HTMLButtonElement>(null);
  const focusAfterRemovalRef = useRef(false);
  const dragRef = useRef<StoneDrag | null>(null);
  const suppressClickRef = useRef<{ x: number; y: number; until: number } | null>(null);

  const selectedMinutes = stones.reduce((total, stone) => total + stone.minutes, 0);

  const calculatedBlocks = Math.max(1, Math.round(selectedMinutes / 25));
  const earnedBreakMinutes = calculatedBlocks * 5;

  useEffect(() => {
    if (!focusAfterRemovalRef.current) return;
    focusAfterRemovalRef.current = false;
    (stackRef.current?.querySelector<HTMLButtonElement>(".lockInStackStone") ?? firstChoiceRef.current)?.focus();
  }, [stones]);

  const handleAddStone = (minutes: number) => {
    if (selectedMinutes + minutes > MAX_FOCUS_MINUTES) return;
    const id = nextStoneId.current++;
    setIsOpenStopwatch(false);
    setStones((current) => [...current, { id, minutes }]);
  };

  const isOverScene = (x: number, y: number) => {
    const bounds = sceneRef.current?.getBoundingClientRect();
    return Boolean(bounds && x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>, minutes: number) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragRef.current = { minutes, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 8) return;
    drag.moved = true;
    setDragPreview({ minutes: drag.minutes, x: event.clientX, y: event.clientY, overScene: isOverScene(event.clientX, event.clientY) });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    setDragPreview(null);
    if (!drag || drag.pointerId !== event.pointerId || !drag.moved) return;
    if (isOverScene(event.clientX, event.clientY)) handleAddStone(drag.minutes);
    suppressClickRef.current = { x: event.clientX, y: event.clientY, until: event.timeStamp + 500 };
  };

  const handlePointerCancel = () => {
    dragRef.current = null;
    setDragPreview(null);
  };

  const handleRemoveStone = (id: number) => {
    focusAfterRemovalRef.current = true;
    setStones((current) => current.filter((stone) => stone.id !== id));
  };

  const handleClearStones = () => {
    focusAfterRemovalRef.current = true;
    setStones([]);
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
            <div>
              <span className="lockInEyebrow">THE FOCUS RITUAL</span>
              <h2 className="lockInHeading">Build your session</h2>
            </div>
            <span className="lockInHeaderMark" aria-hidden="true">✦</span>
          </header>

          {/* Add and remove stones to compose the session length. */}
          <div className="lockInTimerSelector">
            <div className="lockInTimeContent" aria-live="polite" aria-atomic="true">
              <span className="lockInTimeCaption">YOUR FOCUS TIME</span>
              {isOpenStopwatch ? (
                <span className="lockInTimeMain lockInTimeOpen">Open</span>
              ) : (
                <span className="lockInTimeMain">
                  {selectedMinutes}<span className="lockInTimeUnit">min</span>
                </span>
              )}
              <span className="lockInTimeSub">
                {isOpenStopwatch
                  ? "No finish line. Stop when you are ready."
                  : selectedMinutes === 0
                    ? "Choose a stone to begin."
                    : `${calculatedBlocks} ${calculatedBlocks === 1 ? "block" : "blocks"} · ${earnedBreakMinutes}m break earned`}
              </span>
            </div>

            <div
              ref={sceneRef}
              className={`lockInStoneScene ${isOpenStopwatch ? "isOpen" : ""} ${dragPreview?.overScene ? "isDropTarget" : ""}`}
            >
              <span className="lockInSceneHalo" aria-hidden="true" />
              <div
                ref={stackRef}
                className="lockInStoneStack"
                role="group"
                aria-label={isOpenStopwatch ? "Open stopwatch" : stones.length === 0 ? "Empty focus stack" : "Stacked focus stones. Select a stone to remove it."}
              >
                {isOpenStopwatch ? (
                  <span className="lockInOpenSymbol" aria-hidden="true">∞</span>
                ) : stones.length === 0 ? (
                  <span className="lockInEmptyStack">Your first stone goes here</span>
                ) : (
                  <>
                    {stones.slice(-VISIBLE_STONES).reverse().map((stone) => (
                      <button
                        key={stone.id}
                        type="button"
                        className={`lockInStackStone lockInStone${stone.minutes}`}
                        onClick={() => handleRemoveStone(stone.id)}
                        aria-label={`Remove ${stone.minutes} minute stone`}
                        title={`Remove ${stone.minutes} minutes`}
                      >
                        <span>{stone.minutes}</span>
                      </button>
                    ))}
                    {stones.length > VISIBLE_STONES ? (
                      <span className="lockInBuriedStones">+{stones.length - VISIBLE_STONES} below</span>
                    ) : null}
                  </>
                )}
              </div>
              <span className="lockInStonePlinth" aria-hidden="true" />
            </div>

            <div className="lockInStoneGuide">
              <span>STACK YOUR TIME</span>
              <span>{isOpenStopwatch ? "Open session" : `${selectedMinutes} / ${MAX_FOCUS_MINUTES} min`}</span>
            </div>
            <div className="lockInStoneMeter" aria-hidden="true">
              <span style={{ width: `${(isOpenStopwatch ? 0 : selectedMinutes / MAX_FOCUS_MINUTES) * 100}%` }} />
            </div>
            <p className="lockInStoneHint">Tap or drag a stone to add time. Tap the stack to remove one.</p>
            <div className="lockInStoneTray" role="group" aria-label="Add focus time">
              {STONE_MINUTES.map((minutes) => (
                <button
                  key={minutes}
                  ref={minutes === 5 ? firstChoiceRef : undefined}
                  type="button"
                  className={`lockInStoneChoice lockInStone${minutes}`}
                  onClick={(event) => {
                    const suppressed = suppressClickRef.current;
                    suppressClickRef.current = null;
                    if (suppressed && event.timeStamp < suppressed.until && Math.hypot(event.clientX - suppressed.x, event.clientY - suppressed.y) < 12) {
                      return;
                    }
                    handleAddStone(minutes);
                  }}
                  onPointerDown={(event) => handlePointerDown(event, minutes)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerCancel}
                  disabled={selectedMinutes + minutes > MAX_FOCUS_MINUTES}
                  aria-label={`Add ${minutes} minutes to the focus stack`}
                >
                  <span className="lockInChoicePebble" aria-hidden="true" />
                  <strong>+{minutes}</strong>
                  <small>MIN</small>
                </button>
              ))}
            </div>
            <div className="lockInStoneActions">
              <button type="button" onClick={() => setIsOpenStopwatch((value) => !value)}>
                {isOpenStopwatch ? "← Back to stones" : "∞ Open stopwatch"}
              </button>
              {!isOpenStopwatch && stones.length > 0 ? (
                <button type="button" onClick={handleClearStones}>Clear stack</button>
              ) : null}
            </div>
          </div>

          {/* Clean Focus Launch CTA */}
          <button
            type="button"
            className="lockInLaunchBtn"
            onClick={handleLaunchFocus}
            disabled={!isOpenStopwatch && selectedMinutes === 0}
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
      {dragPreview && typeof document !== "undefined"
        ? createPortal(
            <span
              className={`lockInDragStone lockInStone${dragPreview.minutes}`}
              style={{ left: dragPreview.x, top: dragPreview.y }}
              aria-hidden="true"
            >
              {dragPreview.minutes}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}
