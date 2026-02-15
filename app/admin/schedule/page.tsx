"use client";

import { useState } from "react";
import { addMonths, subMonths, format } from "date-fns";
import { ja } from "date-fns/locale";
import { Button } from "@/components/ui/button";

export default function SchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

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
    </div>
  );
}
