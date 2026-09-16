"use client";

import { type FormEvent, useMemo, useState } from "react";
import type { Period } from "../types/school";
import { formatTime12Hour } from "../domain/period-clock";
import { usePeriodsData } from "../hooks/use-periods-data";
import { usePeriodClock } from "../hooks/use-period-clock";
import { usePeriodForm } from "../hooks/use-period-form";
import { PeriodIcon } from "./period-icon";
import { PeriodCard } from "./period-card";
import { PeriodDetailModal } from "./period-detail-modal";
import { PeriodFormModal } from "./period-form-modal";

type SchoolViewProps = {
  userId?: string | null;
};

export function SchoolView({ userId }: SchoolViewProps) {
  const {
    periods,
    isLoaded,
    addPeriod,
    updatePeriod,
    deletePeriod,
    loadSampleSchedule,
  } = usePeriodsData(userId);

  const {
    todayDay,
    currentPeriod,
    nextPeriod,
    getStatus,
  } = usePeriodClock(periods);

  const {
    sheetOpen,
    editingPeriodId,
    form,
    setForm,
    formError,
    setFormError,
    openAdd,
    openEdit,
    closeForm,
    toggleDay,
    selectAllDays,
    selectWeekdays,
    validate,
  } = usePeriodForm();

  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);

  const selectedPeriod = useMemo(() => {
    return periods.find((p) => p.id === selectedPeriodId) ?? null;
  }, [periods, selectedPeriodId]);

  const selectedLiveStatus = useMemo(() => {
    if (!selectedPeriod) return null;
    return getStatus(selectedPeriod);
  }, [selectedPeriod, getStatus]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const error = validate();
    if (error) {
      setFormError(error);
      return;
    }

    if (editingPeriodId) {
      updatePeriod(editingPeriodId, form);
    } else {
      addPeriod(form);
    }

    closeForm();
  };

  const handleDelete = (id: string) => {
    deletePeriod(id);
    if (selectedPeriodId === id) {
      setSelectedPeriodId(null);
    }
  };

  return (
    <div className="schoolContent">
      {/* Header section */}
      <section className="schoolHeader" aria-label="School Schedule Header">
        <div className="schoolHeaderTop">
          <div>
            <span className="schoolSubhead">Schedule</span>
            <h1 className="schoolHeading">School</h1>
          </div>
          <button
            type="button"
            className="schoolAddButton"
            onClick={() => openAdd(periods)}
            aria-label="Add new period"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add period</span>
          </button>
        </div>

        {/* Live Day & Period Status Banner */}
        {currentPeriod ? (
          <div
            className="schoolLiveBanner isLive"
            role="status"
            aria-live="polite"
            onClick={() => setSelectedPeriodId(currentPeriod.period.id)}
            style={{ cursor: "pointer" }}
            title="Click to view details"
          >
            <div className="livePulseDot" aria-hidden="true" />
            <div className="liveBannerInfo">
              <span className="liveBannerTag">IN SESSION NOW</span>
              <strong className="liveBannerTitle">{currentPeriod.period.name}</strong>
              <span className="liveBannerMeta">
                Ends at {formatTime12Hour(currentPeriod.period.endTime)}
                {currentPeriod.minutesRemaining !== undefined ? ` · ${currentPeriod.minutesRemaining}m left` : ""}
                {currentPeriod.period.room ? ` · 📍 ${currentPeriod.period.room}` : ""}
              </span>
            </div>
          </div>
        ) : nextPeriod ? (
          <div
            className="schoolLiveBanner isUpcoming"
            role="status"
            aria-live="polite"
            onClick={() => setSelectedPeriodId(nextPeriod.period.id)}
            style={{ cursor: "pointer" }}
            title="Click to view details"
          >
            <div className="upcomingDot" aria-hidden="true" />
            <div className="liveBannerInfo">
              <span className="upcomingBannerTag">UP NEXT TODAY</span>
              <strong className="liveBannerTitle">{nextPeriod.period.name}</strong>
              <span className="liveBannerMeta">
                Starts at {formatTime12Hour(nextPeriod.period.startTime)}
                {nextPeriod.minutesUntil !== undefined ? ` · in ${nextPeriod.minutesUntil}m` : ""}
                {nextPeriod.period.room ? ` · 📍 ${nextPeriod.period.room}` : ""}
              </span>
            </div>
          </div>
        ) : null}
      </section>

      {/* Main Period Schedule List */}
      <section className="schoolPeriodSection" aria-label="Periods List">
        <div className="schoolSectionTitleRow">
          <h2>Daily Periods</h2>
          {periods.length > 0 ? (
            <span className="periodCountBadge">{periods.length} {periods.length === 1 ? "period" : "periods"}</span>
          ) : null}
        </div>

        {!isLoaded ? (
          <div className="emptyState">Loading schedule…</div>
        ) : periods.length === 0 ? (
          <div className="schoolEmptyState">
            <div className="emptyIconWrapper">
              <PeriodIcon name="book" size={32} />
            </div>
            <h3>No periods yet</h3>
            <p>Add your class periods and when they take place so your day is organized.</p>
            <div className="emptyActions">
              <button
                type="button"
                className="schoolPrimaryButton"
                onClick={() => openAdd(periods)}
              >
                + Add your first period
              </button>
              <button
                type="button"
                className="schoolSecondaryButton"
                onClick={loadSampleSchedule}
              >
                Load sample schedule
              </button>
            </div>
          </div>
        ) : (
          <div className="periodList">
            {periods.map((period) => (
              <PeriodCard
                key={period.id}
                period={period}
                liveStatus={getStatus(period)}
                onSelect={setSelectedPeriodId}
              />
            ))}
          </div>
        )}
      </section>

      {/* Period Details Modal Sheet */}
      {selectedPeriod ? (
        <PeriodDetailModal
          period={selectedPeriod}
          liveStatus={selectedLiveStatus}
          todayDay={todayDay}
          onClose={() => setSelectedPeriodId(null)}
          onEdit={() => {
            const toEdit = selectedPeriod;
            setSelectedPeriodId(null);
            openEdit(toEdit);
          }}
          onDelete={() => {
            handleDelete(selectedPeriod.id);
          }}
        />
      ) : null}

      {/* Add / Edit Period Bottom Sheet */}
      <PeriodFormModal
        sheetOpen={sheetOpen}
        editingPeriodId={editingPeriodId}
        form={form}
        setForm={setForm}
        formError={formError}
        onClose={closeForm}
        onSubmit={handleSubmit}
        onToggleDay={toggleDay}
        onSelectAllDays={selectAllDays}
        onSelectWeekdays={selectWeekdays}
        onDelete={handleDelete}
      />
    </div>
  );
}
