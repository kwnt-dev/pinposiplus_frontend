"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import holidayJp from "@holiday-jp/holiday_jp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});

type Schedule = {
  eventName: string;
  groupCount: string;
  date: string;
};

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([
    { eventName: "月例杯", groupCount: "42", date: "2026-02-20" },
    { eventName: "", groupCount: "38", date: "2026-02-25" },
  ]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [eventName, setEventName] = useState("");
  const [groupCount, setGroupCount] = useState("");

  function handleDateClick(dateStr: string) {
    const existing = schedules.find((s) => s.date === dateStr);
    setEventName(existing?.eventName ?? "");
    setGroupCount(existing?.groupCount ?? "");
    setSelectedDate(dateStr);
  }

  function handleSave() {
    if (!selectedDate) return;
    const title = [eventName, groupCount].filter(Boolean).join(" ");
    if (!title) return;

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

  const calendarEvents = schedules.map((s) => ({
    title: [s.eventName, s.groupCount ? `${s.groupCount}組` : ""]
      .filter(Boolean)
      .join(" "),
    date: s.date,
  }));

  return (
    <div className="p-4">
      <h1>予定表</h1>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="ja"
        events={calendarEvents}
        dateClick={(info) => handleDateClick(info.dateStr)}
        dayCellClassNames={(arg) => {
          if (holidayJp.isHoliday(arg.date) || arg.date.getDay() === 0)
            return "bg-red-50";
          if (arg.date.getDay() === 6) return "bg-blue-50";
          return "";
        }}
      />

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
