"use client";

import { useState } from "react";
import GreenCanvas from "@/components/greens/GreenCanvas";

export default function TestPage() {
  const [damageCells, setDamageCells] = useState<string[]>([]);

  const handleCellClick = (cellId: string) => {
    console.log("クリックされたセル:", cellId);
    if (damageCells.includes(cellId)) {
      setDamageCells(damageCells.filter((id) => id !== cellId));
    } else {
      setDamageCells([...damageCells, cellId]);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">GreenCanvas テスト</h1>
      <p className="mb-4">ダメージセル: {damageCells.length}個</p>
      <GreenCanvas
        hole="1"
        damageCells={damageCells}
        onCellClick={handleCellClick}
      />
    </div>
  );
}
