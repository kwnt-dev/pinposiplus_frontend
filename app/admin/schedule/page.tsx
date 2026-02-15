"use client";

import { useState } from "react";
import {
  addMonths,
  subMonths,
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  getDay,
} from "date-fns";
import { ja } from "date-fns/locale";
import { Button } from "@/components/ui/button";

export default function SchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">予定表</h1>

      <div className="flex items-center gap-3 mb-4">
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

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">日付</th>
            <th className="border p-2 text-left">曜日</th>
            <th className="border p-2 text-left">祝日</th>
            <th className="border p-2 text-left">イベント</th>
            <th className="border p-2 text-left">組数</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.toISOString()}>
              <td className="border p-2">{format(day, "d")}</td>
              <td className="border p-2">{weekDays[getDay(day)]}</td>
              <td className="border p-2"></td>
              <td className="border p-2"></td>
              <td className="border p-2"></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
