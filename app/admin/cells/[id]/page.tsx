"use client";

import { useEffect, useState } from "react";
import GreenCanvas from "@/components/greens/GreenCanvas";
import { HoleData } from "@/lib/greenCanvas.geometry";
import { useParams } from "next/navigation";

export default function CellEditPage() {
  const { id } = useParams();
  const hole = id as string;

  const [holeData, setHoleData] = useState<HoleData | null>(null);
  const [damageCells, setDamageCells] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(`cells_damage_${hole}`);
    return data ? JSON.parse(data) : [];
  });
  const [banCells, setBanCells] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(`cells_ban_${hole}`);
    return data ? JSON.parse(data) : [];
  });
  const [rainCells, setRainCells] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(`cells_rain_${hole}`);
    return data ? JSON.parse(data) : [];
  });
  const [mode, setMode] = useState<"damage" | "ban" | "rain">("damage");

  const handleCellClick = (cellId: string) => {
    if (mode === "damage") {
      if (damageCells.includes(cellId)) {
        setDamageCells(damageCells.filter((id) => id !== cellId));
      } else {
        setDamageCells([...damageCells, cellId]);
      }
    }
    if (mode === "ban") {
      if (banCells.includes(cellId)) {
        setBanCells(banCells.filter((id) => id !== cellId));
      } else {
        setBanCells([...banCells, cellId]);
      }
    }
    if (mode === "rain") {
      if (rainCells.includes(cellId)) {
        setRainCells(rainCells.filter((id) => id !== cellId));
      } else {
        setRainCells([...rainCells, cellId]);
      }
    }
  };

  useEffect(() => {
    const paddedHole = hole.padStart(2, "0");
    fetch(`/greens/hole_${paddedHole}.json`)
      .then((res) => res.json())
      .then((data) => setHoleData(data))
      .catch((err) => console.error("JSON読み込みエラー:", err));
  }, [hole]);

  if (!holeData) {
    return <div>読み込み中...</div>;
  }

  return (
    <div>
      <button
        onClick={() => {
          localStorage.setItem(
            `cells_damage_${hole}`,
            JSON.stringify(damageCells),
          );
          localStorage.setItem(`cells_ban_${hole}`, JSON.stringify(banCells));
          localStorage.setItem(`cells_rain_${hole}`, JSON.stringify(rainCells));
        }}
      >
        保存
      </button>
      <button onClick={() => setMode("damage")}>傷み</button>
      <button onClick={() => setMode("ban")}>禁止</button>
      <button onClick={() => setMode("rain")}>雨天禁止</button>
      <GreenCanvas
        hole={hole}
        damageCells={damageCells}
        banCells={banCells}
        rainCells={rainCells}
        onCellClick={handleCellClick}
      />
    </div>
  );
}
