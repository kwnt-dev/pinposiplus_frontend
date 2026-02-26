"use client";

import { useState, useEffect } from "react";
import {
  addMonths,
  subMonths,
  format,
  startOfMonth,
  endOfMonth,
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
import api from "@/lib/axios";
import { PageHeader } from "@/components/layout/PageHeader";
import { Calendar } from "lucide-react";

type Schedule = {
  id: string;
  date: string;
  event_name: string | null;
  group_count: number | null;
  notes: string | null;
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

  // 月が変わるたびにAPIから取得
  useEffect(() => {
    const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    api
      .get(`/api/schedules?start_date=${startDate}&end_date=${endDate}`)
      .then((response) => {
        setSchedules(response.data);
      });
  }, [currentMonth]);

  async function fetchSchedules() {
    const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    const response = await api.get(
      `/api/schedules?start_date=${startDate}&end_date=${endDate}`,
    );
    setSchedules(response.data);
  }

  function toDateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function getExisting(dateStr: string) {
    return schedules.find((s) => s.date === dateStr);
  }

  function handleDayClick(day: number) {
    const dateStr = toDateStr(day);
    const existing = getExisting(dateStr);
    setEventName(existing?.event_name ?? "");
    setGroupCount(existing?.group_count?.toString() ?? "");
    setSelectedDate(dateStr);
  }

  function handleSave() {
    if (!selectedDate) return;
    if (!eventName && !groupCount) return;
    setSchedules((prev) => [
      ...prev.filter((s) => s.date !== selectedDate),
      {
        id: "",
        date: selectedDate,
        event_name: eventName || null,
        group_count: groupCount ? Number(groupCount) : null,
        notes: null,
      },
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
      <PageHeader icon={Calendar} title="予定表" />

      <div className="flex-1 min-h-0 bg-card rounded-xl shadow-sm border overflow-hidden flex flex-col">
        {/* ヘッダーバー: 月切り替え */}
        <div className="flex-shrink-0 h-[42px] px-4 bg-gray-800 flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/20"
            onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
          >
            ◀
          </Button>
          <span className="font-bold text-sm text-white min-w-[140px] text-center">
            {format(currentMonth, "yyyy年 M月", { locale: ja })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/20"
            onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
          >
            ▶
          </Button>
        </div>

        {/* 曜日ヘッダー */}
        <div className="flex-shrink-0 grid grid-cols-7 border-b bg-muted">
          {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
            <div key={d} className="text-center py-1 text-sm font-bold">
              {d}
            </div>
          ))}
        </div>

        {/* カレンダー本体 */}
        <div className="flex-1 min-h-0 grid grid-cols-7 auto-rows-fr">
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
            const schedule = getExisting(dateStr);

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
                  {schedule?.group_count && (
                    <span className="text-xs text-green-600 font-bold">
                      {schedule.group_count}組
                    </span>
                  )}
                </div>
                {schedule?.event_name && (
                  <div className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded mt-1 inline-block">
                    {schedule.event_name}
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
