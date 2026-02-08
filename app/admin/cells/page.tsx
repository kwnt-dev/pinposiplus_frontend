"use client";

import { useState } from "react";
import GreenCardGrid from "@/components/greens/GreenCardGrid";
import { useRouter } from "next/navigation";

export default function CellsPage() {
  const [course, setCourse] = useState<"out" | "in">("out");
  const router = useRouter();

  const [holeDamageCells] = useState<{ hole: number; cellIds: string[] }[]>(
    () => {
      if (typeof window === "undefined") return [];
      const loadedCells: { hole: number; cellIds: string[] }[] = [];
      for (let i = 1; i <= 18; i++) {
        const data = localStorage.getItem(`cell_${i}`);
        if (data) {
          const cellIds = JSON.parse(data);
          loadedCells.push({ hole: i, cellIds: cellIds });
        }
      }
      return loadedCells;
    },
  );
  return (
    <div className="p-8">
      <button onClick={() => setCourse("out")}>OUT</button>
      <button onClick={() => setCourse("in")}>IN</button>
      <GreenCardGrid
        course={course}
        onCardClick={(holeId) => router.push(`/admin/cells/${holeId}`)}
        holeDamageCells={holeDamageCells}
      />
    </div>
  );
}
