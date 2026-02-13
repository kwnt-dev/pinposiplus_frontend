"use client";

import { useState } from "react";
import GreenCanvas from "@/components/greens/GreenCanvas";
import { Pin } from "@/lib/greenCanvas.geometry";
import GreenCard from "@/components/greens/GreenCard";
import GreenCardGrid from "@/components/greens/GreenCardGrid";

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
    { id: "past1", x: 30, y: 20 },
    { id: "past2", x: 35, y: 47 },
  ];

  const [currentPin, setCurrentPin] = useState<Pin>({
    id: "pin1",
    x: 30,
    y: 35,
  });

  const [course, setCourse] = useState<"out" | "in">("out");

  function handlePinDragged(newPin: Pin) {
    console.log("新しい座標", newPin);
    setCurrentPin(newPin);
  }

  return (
    <div className="p-8">
      <button onClick={() => setCourse("out")}>OUT</button>
      <button onClick={() => setCourse("in")}>IN</button>
      <GreenCardGrid course={course} />
    </div>
  );
}
