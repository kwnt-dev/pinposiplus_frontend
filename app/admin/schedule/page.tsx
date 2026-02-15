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
import holidayJp from "@holiday-jp/holiday_jp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Schedule = {
  eventName: string;
  groupCount: string;
  date: string;
};

export default function SchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [eventName, setEventName] = useState("");
  const [groupCount, setGroupCount] = useState("");

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfWeek = getDay(startOfMonth(currentMonth));
  const daysInMonth = getDaysInMonth(currentMonth);

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  function toDateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function handleDayClick(day: number) {
    const dateStr = toDateStr(day);
    const existing = schedules.find((s) => s.date === dateStr);
    setEventName(existing?.eventName ?? "");
    setGroupCount(existing?.groupCount ?? "");
    setSelectedDate(dateStr);
  }

  function handleSave() {
    if (!selectedDate) return;
    if (!eventName && !groupCount) return;
    setSchedules((prev) => [
      ...prev.filter((s) => s.date !== selectedDate),
      { eventName, groupCount, date: selectedDate },
    ]);
    setSelectedDate(null);
  }

  function handleDelete() {
    if (!selectedDate) return;
    setSchedules((prev) => prev.filter((s) => s.date !== selectedDate));
    setSelectedDate(null);
  }

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
          {calendarDays.map((day, i) => {
            if (day === null)
              return <div key={`e-${i}`} className="border p-1" />;

            const dateStr = toDateStr(day);
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay();
            const isHoliday = holidayJp.isHoliday(date);
            const holiday = isHoliday
              ? holidayJp.between(date, date)[0].name
              : null;
            const schedule = schedules.find((s) => s.date === dateStr);

            return (
              <div
                key={day}
                className={`border p-1 cursor-pointer hover:bg-gray-100 ${
                  isHoliday || dayOfWeek === 0
                    ? "bg-red-50"
                    : dayOfWeek === 6
                      ? "bg-blue-50"
                      : ""
                }`}
                onClick={() => handleDayClick(day)}
              >
                <div className="flex justify-between">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-sm font-bold ${
                        isHoliday || dayOfWeek === 0
                          ? "text-red-500"
                          : dayOfWeek === 6
                            ? "text-blue-500"
                            : ""
                      }`}
                    >
                      {day}
                    </span>
                    {holiday && (
                      <span className="text-xs text-red-500">{holiday}</span>
                    )}
                  </div>
                  {schedule?.groupCount && (
                    <span className="text-xs text-green-600 font-bold">
                      {schedule.groupCount}組
                    </span>
                  )}
                </div>
                {schedule?.eventName && (
                  <div className="text-xs text-blue-600 mt-1">
                    {schedule.eventName}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDate}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>イベント名</Label>
              <Input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
            </div>
            <div>
              <Label>組数</Label>
              <Input
                type="number"
                value={groupCount}
                onChange={(e) => setGroupCount(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>保存</Button>
              <Button variant="destructive" onClick={handleDelete}>
                削除
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
