import { formatGoogleTaskDueDate, getDueDateStatus } from "../domain/date-utils";

type GoogleTasksDateBadgeProps = {
  dueDate: string;
  today: string;
  completed?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
};

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

  const badgeTitle = title || (onClick ? `Due ${dueDate} (click to change)` : dueDate);

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
        <svg
          className="googleDateIcon"
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
          <polyline points="8.5 12 11 14.5 15.5 9.5" />
        </svg>
        <span>{label}</span>
      </button>
    );
  }

  return (
    <span className={`googleDateBadge is-${status}`} title={badgeTitle}>
      <svg
        className="googleDateIcon"
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
        <polyline points="8.5 12 11 14.5 15.5 9.5" />
      </svg>
      <span>{label}</span>
    </span>
  );
}
