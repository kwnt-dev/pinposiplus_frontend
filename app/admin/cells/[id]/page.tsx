"use client";

import { useEffect, useState } from "react";
import GreenCanvas, { HoleData } from "@/components/greens/GreenCanvas";
import { useParams } from "next/navigation";

export default function CellEditPage() {
  const { id } = useParams();
  const hole = id as string;

  const [holeData, setHoleData] = useState<HoleData | null>(null);
  const [damageCells, setDamageCells] = useState<string[]>([]);

  const handleCellClick = (cellId: string) => {
    console.log("クリックされたセル:", cellId);
    if (damageCells.includes(cellId)) {
      setDamageCells(damageCells.filter((id) => id !== cellId));
    } else {
      setDamageCells([...damageCells, cellId]);
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
          console.log("保存クリック");
          localStorage.setItem(`cell_${hole}`, JSON.stringify(damageCells));
        }}
      >
        保存
      </button>
      <GreenCanvas
        hole={hole}
        damageCells={damageCells}
        onCellClick={handleCellClick}
      />
    </div>
  );
}
