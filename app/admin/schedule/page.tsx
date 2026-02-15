"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});

const mockEvents = [
  { title: "月例杯 42組", date: "2026-02-20" },
  { title: "38組", date: "2026-02-25" },
  { title: "クラブ選手権 45組", date: "2026-03-01" },
];

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  return (
    <div className="p-4">
      <h1>予定表</h1>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="ja"
        events={mockEvents}
        dateClick={(info) => setSelectedDate(info.dateStr)}
      />

      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDate}</DialogTitle>
          </DialogHeader>
          <p>ここに編集フォームを追加</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
