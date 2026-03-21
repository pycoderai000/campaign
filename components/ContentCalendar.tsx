"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import type { Deliverable, DeliverableStatus } from "@/types";
import { normalizePostingDateToYmd } from "@/lib/posting-date";

interface ContentCalendarProps {
  deliverables: Deliverable[];
  campaignName: string;
  onDeliverableClick?: (deliverable: Deliverable) => void;
}

export default function ContentCalendar({ deliverables, campaignName, onDeliverableClick }: ContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const didSnapToDataMonth = useRef(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  /** postingDate -> deliverable[] for fast lookup */
  const byYmd = useMemo(() => {
    const map = new Map<string, Deliverable[]>();
    for (const d of deliverables) {
      const ymd = normalizePostingDateToYmd(d.postingDate);
      if (!ymd) continue;
      const list = map.get(ymd) ?? [];
      list.push(d);
      map.set(ymd, list);
    }
    return map;
  }, [deliverables]);

  useEffect(() => {
    if (didSnapToDataMonth.current || deliverables.length === 0) return;
    const dates = [...byYmd.keys()].sort();
    if (dates.length === 0) {
      didSnapToDataMonth.current = true;
      return;
    }
    const first = dates[0];
    const [y, m] = first.split("-").map(Number);
    setCurrentDate(new Date(y, m - 1, 1));
    didSnapToDataMonth.current = true;
  }, [deliverables, byYmd]);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const getDeliverablesForDate = (date: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
    return byYmd.get(dateStr) ?? [];
  };

  const getStatusColor = (status: DeliverableStatus): string => {
    const colors: Record<DeliverableStatus, string> = {
      Live: "bg-green-500 text-white",
      "In revision": "bg-red-500 text-white",
      Approved: "bg-blue-500 text-white",
      "New content": "bg-orange-500 text-white",
      Cancelled: "bg-gray-500 text-white",
    };
    return colors[status] || "bg-gray-400 text-white";
  };

  const navigateMonth = (direction: "prev" | "next") => {
    didSnapToDataMonth.current = true;
    setCurrentDate(new Date(year, month + (direction === "next" ? 1 : -1), 1));
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const calendarDays: (number | null)[] = [];

  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const skippedCount = deliverables.filter((d) => !normalizePostingDateToYmd(d.postingDate)).length;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-soft border border-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800">
            Content Calendar - {campaignName}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigateMonth("prev")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-base sm:text-lg font-semibold text-gray-800 min-w-[180px] sm:min-w-[200px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => navigateMonth("next")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {skippedCount > 0 && (
          <p className="text-sm text-amber-700 mb-2">
            {skippedCount} item(s) have a posting date that could not be read — fix dates so they appear on the calendar.
          </p>
        )}

        <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-xs sm:text-sm text-gray-700">Live</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-xs sm:text-sm text-gray-700">In revision</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span className="text-xs sm:text-sm text-gray-700">Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500"></div>
            <span className="text-xs sm:text-sm text-gray-700">New content</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs sm:text-sm font-bold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square"></div>;
              }

              const dayDeliverables = getDeliverablesForDate(day);

              return (
                <div
                  key={day}
                  className="aspect-square border border-gray-200 rounded-lg p-1 sm:p-2 bg-white hover:bg-gray-50 transition-colors min-h-[60px] sm:min-h-[80px]"
                >
                  <div className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">{day}</div>
                  <div className="space-y-1 overflow-y-auto max-h-[calc(100%-20px)]">
                    {dayDeliverables.map((deliverable) => (
                      <div
                        key={deliverable.id}
                        role={onDeliverableClick ? "button" : undefined}
                        onClick={() => onDeliverableClick?.(deliverable)}
                        className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded truncate ${getStatusColor(deliverable.status)} ${onDeliverableClick ? "cursor-pointer hover:opacity-90" : ""}`}
                        title={deliverable.name}
                      >
                        {deliverable.name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
