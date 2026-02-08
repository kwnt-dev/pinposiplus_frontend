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
        const data = localStorage.getItem(`cells_damage_${i}`);
        if (data) {
          const cellIds = JSON.parse(data);
          loadedCells.push({ hole: i, cellIds: cellIds });
        }
      }
      return loadedCells;
    },
  );

  const [holeBanCells] = useState<{ hole: number; cellIds: string[] }[]>(() => {
    if (typeof window === "undefined") return [];
    const loadedCells: { hole: number; cellIds: string[] }[] = [];
    for (let i = 1; i <= 18; i++) {
      const data = localStorage.getItem(`cells_ban_${i}`);
      if (data) {
        const cellIds = JSON.parse(data);
        loadedCells.push({ hole: i, cellIds: cellIds });
      }
    }
    return loadedCells;
  });

  const [holeRainCells] = useState<{ hole: number; cellIds: string[] }[]>(
    () => {
      if (typeof window === "undefined") return [];
      const loadedCells: { hole: number; cellIds: string[] }[] = [];
      for (let i = 1; i <= 18; i++) {
        const data = localStorage.getItem(`cells_rain_${i}`);
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
        holeBanCells={holeBanCells}
        holeRainCells={holeRainCells}
      />
    </div>
  );
}
