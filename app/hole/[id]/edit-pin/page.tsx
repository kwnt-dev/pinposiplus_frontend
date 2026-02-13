"use client";

import { useEffect, useState } from "react";
import GreenCanvas from "@/components/greens/GreenCanvas";
import {
  Pin,
  HoleData,
  getBoundaryIntersectionY,
} from "@/lib/greenCanvas.geometry";
import { useParams } from "next/navigation";

export default function PinEditPage() {
  const { id } = useParams();
  const hole = id as string;

  const pastPins = [
    { id: "past1", x: 30, y: 20 },
    { id: "past2", x: 35, y: 47 },
  ];

  const [currentPin, setCurrentPin] = useState<Pin>(() => {
    if (typeof window === "undefined") return { id: "pin1", x: 30, y: 35 };
    const data = localStorage.getItem(`pin_${hole}`);
    return data ? JSON.parse(data) : { id: "pin1", x: 30, y: 35 };
  });

  function handlePinDragged(newPin: Pin) {
    console.log("新しい座標", newPin);
    setCurrentPin(newPin);
  }
  const [holeData, setHoleData] = useState<HoleData | null>(null);

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

  // 0.5刻みに丸める（例: 3.1→3.0, 3.3→3.5, 3.8→4.0）
  const roundToHalf = (value: number) => Math.round(value * 2) / 2;

  const depth = Math.round(holeData.origin.y - currentPin.y);
  const edges = getBoundaryIntersectionY(holeData.boundary.d, currentPin.y);

  let horizontal = "";
  if (Math.abs(currentPin.x - 30) < 0.5) {
    horizontal = "C(中心線)";
  } else if (currentPin.x > 30 && edges) {
    const dist = roundToHalf(edges.right - currentPin.x);
    horizontal = `右外周から${dist}yd`;
  } else if (edges) {
    const dist = roundToHalf(currentPin.x - edges.left);
    horizontal = `左外周から${dist}yd`;
  }

  return (
    <div>
      {`奥行${Math.round(holeData.origin.y - currentPin.y)}yd, ${horizontal}`}
      <button
        onClick={() => {
          console.log("保存クリック");
          localStorage.setItem(`pin_${hole}`, JSON.stringify(currentPin));
        }}
      >
        保存
      </button>
      <GreenCanvas
        hole={hole}
        currentPin={currentPin}
        onPinDragged={handlePinDragged}
      />
    </div>
  );
}
