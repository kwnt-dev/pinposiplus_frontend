"use client";

import { useState } from "react";
import {
  addMonths,
  subMonths,
  format,
  startOfMonth,
  getDay,
  getDaysInMonth,
} from "date-fns";
import { ja } from "date-fns/locale";
import { Button } from "@/components/ui/button";

export default function SchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const firstDayOfWeek = getDay(startOfMonth(currentMonth));
  const daysInMonth = getDaysInMonth(currentMonth);

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
        >
          ◀
        </Button>
        <span className="font-bold text-lg min-w-[140px] text-center">
          {format(currentMonth, "yyyy年 M月", { locale: ja })}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
        >
          ▶
        </Button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="grid grid-cols-7">
          {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
            <div key={d} className="text-center py-1 text-sm font-bold">
              {d}
            </div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 auto-rows-fr">
          {calendarDays.map((day, i) => (
            <div key={day ?? `e-${i}`} className="border p-1">
              {day && <span className="text-sm">{day}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
