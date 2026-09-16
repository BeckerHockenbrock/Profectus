"use client";

import { useState } from "react";
import type { DayOfWeek, Period, PeriodFormData } from "../types/school";
import { ALL_DAYS, WEEKDAYS } from "../types/school";
import { calculateNextEndTime, timeToMinutes } from "../domain/period-clock";

export const initialFormData: PeriodFormData = {
  name: "",
  startTime: "08:30",
  endTime: "09:25",
  room: "",
  days: WEEKDAYS,
  icon: "book",
};

export function usePeriodForm() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [form, setForm] = useState<PeriodFormData>(initialFormData);
  const [formError, setFormError] = useState("");

  const openAdd = (existingPeriods: Period[]) => {
    const nextPeriodNum = existingPeriods.length + 1;
    setEditingPeriodId(null);
    setForm({
      name: `Period ${nextPeriodNum}`,
      startTime: existingPeriods.length > 0 ? existingPeriods[existingPeriods.length - 1].endTime : "08:30",
      endTime: existingPeriods.length > 0 ? calculateNextEndTime(existingPeriods[existingPeriods.length - 1].endTime, 50) : "09:20",
      room: "",
      days: WEEKDAYS,
      icon: "book",
    });
    setFormError("");
    setSheetOpen(true);
  };

  const openEdit = (period: Period) => {
    setEditingPeriodId(period.id);
    setForm({
      name: period.name,
      startTime: period.startTime,
      endTime: period.endTime,
      room: period.room || "",
      days: period.days && period.days.length > 0 ? period.days : WEEKDAYS,
      icon: period.icon || "book",
    });
    setFormError("");
    setSheetOpen(true);
  };

  const closeForm = () => {
    setSheetOpen(false);
    setEditingPeriodId(null);
    setForm(initialFormData);
    setFormError("");
  };

  const toggleDay = (day: DayOfWeek) => {
    setForm((prev) => {
      const exists = prev.days.includes(day);
      if (exists) {
        if (prev.days.length === 1) return prev;
        return { ...prev, days: prev.days.filter((d) => d !== day) };
      }
      return { ...prev, days: [...prev.days, day] };
    });
  };

  const selectAllDays = () => {
    setForm((prev) => ({ ...prev, days: ALL_DAYS }));
  };

  const selectWeekdays = () => {
    setForm((prev) => ({ ...prev, days: WEEKDAYS }));
  };

  const validate = (): string | null => {
    const name = form.name.trim();
    if (!name) {
      return "Please enter a period title or name.";
    }
    if (!form.startTime || !form.endTime) {
      return "Please set both start and end times.";
    }
    if (timeToMinutes(form.endTime) <= timeToMinutes(form.startTime)) {
      return "End time must be after start time.";
    }
    if (form.days.length === 0) {
      return "Please choose at least one day.";
    }
    return null;
  };

  return {
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
  };
}
