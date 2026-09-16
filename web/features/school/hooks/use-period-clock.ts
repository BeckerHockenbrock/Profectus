"use client";

import { useEffect, useMemo, useState } from "react";
import type { Period } from "../types/school";
import { getPeriodStatus, getTodayDayOfWeek } from "../domain/period-clock";

export function usePeriodClock(periods: Period[]) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update live clock every 30 seconds for dynamic period status
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const todayDay = useMemo(() => getTodayDayOfWeek(currentTime), [currentTime]);

  // Determine current active period or next upcoming period today
  const { currentPeriod, nextPeriod } = useMemo(() => {
    let current: { period: Period; minutesRemaining?: number } | null = null;
    let next: { period: Period; minutesUntil?: number } | null = null;

    for (const p of periods) {
      const live = getPeriodStatus(p, currentTime);
      if (!live) continue;
      if (live.status === "current") {
        current = { period: p, minutesRemaining: live.minutesRemaining };
      } else if (live.status === "next" && !next) {
        next = { period: p, minutesUntil: live.minutesUntil };
      } else if (live.status === "upcoming" && !next) {
        next = { period: p, minutesUntil: live.minutesUntil };
      }
    }
    return { currentPeriod: current, nextPeriod: next };
  }, [periods, currentTime]);

  const getStatus = (period: Period) => {
    return getPeriodStatus(period, currentTime);
  };

  return {
    currentTime,
    todayDay,
    currentPeriod,
    nextPeriod,
    getStatus,
  };
}
