"use client";

import { useState } from "react";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { ja } from "date-fns/locale";
import holidayJp from "@holiday-jp/holiday_jp";

export default function SchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">予定表</h1>
      <Calendar
        locale={ja}
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        className="[--cell-size:--spacing(20)]"
        modifiers={{
          holiday: (date) => holidayJp.isHoliday(date),
        }}
        modifiersClassNames={{
          holiday: "text-red-500 font-bold",
        }}
        components={{
          DayButton: ({ children, modifiers, day, ...props }) => (
            <CalendarDayButton day={day} modifiers={modifiers} {...props}>
              <span>{children}</span>
            </CalendarDayButton>
          ),
        }}
      />
    </div>
  );
}
