import type { Period, PeriodStatusInfo } from "../types/school";
import { formatTime12Hour } from "../domain/period-clock";
import { PeriodIcon } from "./period-icon";

type PeriodCardProps = {
  period: Period;
  liveStatus: PeriodStatusInfo | null;
  onSelect: (periodId: string) => void;
};

export function PeriodCard({ period, liveStatus, onSelect }: PeriodCardProps) {
  const isCurrent = liveStatus?.status === "current";
  const isNext = liveStatus?.status === "next";

  return (
    <article
      className={`periodCard ${isCurrent ? "isPeriodCurrent" : ""} ${isNext ? "isPeriodNext" : ""}`}
      onClick={() => onSelect(period.id)}
      role="button"
      tabIndex={0}
      aria-label={`${period.name}, from ${formatTime12Hour(period.startTime)} to ${formatTime12Hour(period.endTime)}. Tap to view details.`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(period.id);
        }
      }}
    >
      <div className="periodIconBadge" aria-hidden="true">
        <PeriodIcon name={period.icon || "book"} size={18} />
      </div>

      <div className="periodCardContent">
        <h3 className="periodName">{period.name}</h3>
        <div className="periodCardMeta">
          <span className="periodTimeRange">
            {formatTime12Hour(period.startTime)} – {formatTime12Hour(period.endTime)}
          </span>
          {period.room ? (
            <span className="periodRoomMini">· {period.room}</span>
          ) : null}
        </div>
      </div>

      <div className="periodCardRight">
        {isCurrent ? (
          <span className="statusBadge inSession">In session</span>
        ) : isNext ? (
          <span className="statusBadge upNext">Up next</span>
        ) : null}
        <span className="periodCardChevron" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
      </div>
    </article>
  );
}
