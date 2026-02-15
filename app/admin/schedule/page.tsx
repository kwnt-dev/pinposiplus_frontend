"use client";

import dynamic from "next/dynamic";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});
import dayGridPlugin from "@fullcalendar/daygrid";

export default function SchedulePage() {
  return (
    <div className="p-4">
      <h1>予定表</h1>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        locale="ja"
      />
    </div>
  );
}
