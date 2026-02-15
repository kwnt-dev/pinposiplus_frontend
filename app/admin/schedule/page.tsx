"use client";

import { useState } from "react";
import { addMonths, subMonths, format } from "date-fns";
import { ja } from "date-fns/locale";

export default function SchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  return (
    <div className="p-4">
      <h1>予定表</h1>
      <button onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}>
        ◀
      </button>
      <span>{format(currentMonth, "yyyy年 M月", { locale: ja })}</span>
      <button onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}>
        ▶
      </button>

      <div className="grid grid-cols-7">
        {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
    </div>
  );
}
