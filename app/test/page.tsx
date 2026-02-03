"use client";

import { useState } from "react";
import GreenCanvas from "@/components/greens/GreenCanvas";

export default function TestPage() {
  const [damageCells, setDamageCells] = useState<string[]>([]);
  const [banCells, setBanCells] = useState<string[]>([
    "cell_25_35",
    "cell_26_35",
  ]);
  const [rainCells, setRainCells] = useState<string[]>([
    "cell_35_40",
    "cell_36_40",
  ]);

  const handleCellClick = (cellId: string) => {
    console.log("クリックされたセル:", cellId);
    if (damageCells.includes(cellId)) {
      setDamageCells(damageCells.filter((id) => id !== cellId));
    } else {
      setDamageCells([...damageCells, cellId]);
    }
  };

  const currentPin = { id: "pin1", x: 30, y: 35 };

  return (
    <div className="p-8">
      <GreenCanvas
        hole="1"
        damageCells={damageCells}
        banCells={banCells}
        rainCells={rainCells}
        onCellClick={handleCellClick}
        currentPin={currentPin}
      />
    </div>
  );
}
