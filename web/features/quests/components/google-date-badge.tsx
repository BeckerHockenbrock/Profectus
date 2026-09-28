import type React from "react";
import { formatGoogleTaskDueDate, getDueDateStatus } from "../domain/date-utils";
import type { DueDateStatus } from "../domain/date-utils";

type GoogleTasksDateBadgeProps = {
  dueDate: string;
  today: string;
  completed?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
};

export function DateStatusIcon({
  status,
  dayNumber,
}: {
  status: DueDateStatus;
  dayNumber?: number | null;
}) {
  if (status === "today") {
    return (
      <svg
        className="googleDateIcon isTodayIcon"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="17" rx="3.5" />
        <line x1="16" y1="2.5" x2="16" y2="5.5" />
        <line x1="8" y1="2.5" x2="8" y2="5.5" />
        <line x1="3" y1="9.5" x2="21" y2="9.5" />
        {dayNumber ? (
          <text
            x="12"
            y="17.8"
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="800"
            fill="currentColor"
            stroke="none"
            letterSpacing="-0.03em"
            fontFamily="inherit"
          >
            {dayNumber}
          </text>
        ) : (
          <circle cx="12" cy="15.2" r="1.8" fill="currentColor" stroke="none" />
        )}
      </svg>
    );
  }

  if (status === "tomorrow") {
    return (
      <svg
        className="googleDateIcon isTomorrowIcon"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4.5" />
        <line x1="12" y1="2" x2="12" y2="4.5" />
        <line x1="12" y1="19.5" x2="12" y2="22" />
        <line x1="2" y1="12" x2="4.5" y2="12" />
        <line x1="19.5" y1="12" x2="22" y2="12" />
        <line x1="5" y1="5" x2="6.8" y2="6.8" />
        <line x1="17.2" y1="17.2" x2="19" y2="19" />
        <line x1="5" y1="19" x2="6.8" y2="17.2" />
        <line x1="17.2" y1="6.8" x2="19" y2="5" />
      </svg>
    );
  }

  if (status === "overdue") {
    return (
      <svg
        className="googleDateIcon isOverdueIcon"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="8" x2="12" y2="12.5" strokeWidth="2.4" />
        <circle cx="12" cy="16.5" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return (
    <svg
      className="googleDateIcon isFutureIcon"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  );
}

export function DateStatusPip({ status }: { status: DueDateStatus }) {
  if (status === "today") {
    return <span className="googleDatePip is-today" aria-hidden="true" />;
  }
  if (status === "tomorrow") {
    return <span className="googleDatePip is-tomorrow" aria-hidden="true" />;
  }
  if (status === "overdue") {
    return <span className="googleDatePip is-overdue" aria-hidden="true" />;
  }
  return null;
}

export function GoogleTasksDateBadge({
  dueDate,
  today,
  completed = false,
  onClick,
  title,
}: GoogleTasksDateBadgeProps) {
  if (!dueDate) return null;
  const status = getDueDateStatus(dueDate, today, completed);
  const label = formatGoogleTaskDueDate(dueDate, today);
  if (!label) return null;

  const todayDayNum = today ? Number(today.slice(8, 10)) : null;
  const badgeTitle = title || (onClick ? `Due ${dueDate} (click to change)` : dueDate);

  const content = (
    <>
      <DateStatusIcon status={status} dayNumber={todayDayNum} />
      <span>{label}</span>
      <DateStatusPip status={status} />
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={`googleDateBadge is-${status} isClickable`}
        title={badgeTitle}
        aria-label={`Due ${label}. Click to change due date`}
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={`googleDateBadge is-${status}`} title={badgeTitle}>
      {content}
    </span>
  );
}
