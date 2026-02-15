"use client";

import dynamic from "next/dynamic";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});
import dayGridPlugin from "@fullcalendar/daygrid";

const mockEvents = [
  { title: "月例杯 42組", date: "2026-02-20" },
  { title: "38組", date: "2026-02-25" },
  { title: "クラブ選手権 45組", date: "2026-03-01" },
];

export default function SchedulePage() {
  return (
    <div className="p-4">
      <h1>予定表</h1>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        locale="ja"
        events={mockEvents}
      />
    </div>
  );
}
