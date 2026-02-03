"use client";

import { useState } from "react";
import GreenCanvas, { Pin } from "@/components/greens/GreenCanvas";

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

  const pastPins = [
    { id: "past1", x: 25, y: 30 },
    { id: "past2", x: 35, y: 40 },
  ];

  const [currentPin, setCurrentPin] = useState<Pin>({
    id: "pin1",
    x: 30,
    y: 35,
  });

  function handlePinDragged(newPin: Pin) {
    console.log("新しい座標", newPin);
    setCurrentPin(newPin);
  }

  return (
    <div className="p-8">
      <GreenCanvas
        hole="1"
        damageCells={damageCells}
        banCells={banCells}
        rainCells={rainCells}
        onCellClick={handleCellClick}
        currentPin={currentPin}
        onPinDragged={handlePinDragged}
        pastPins={pastPins}
      />
    </div>
  );
}
