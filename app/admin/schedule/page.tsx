"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";

export default function SchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">予定表</h1>
      <Calendar month={currentMonth} onMonthChange={setCurrentMonth} />
    </div>
  );
}
