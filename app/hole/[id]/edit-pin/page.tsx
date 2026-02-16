"use client";

import { useEffect, useState } from "react";
import GreenCanvas from "@/components/greens/GreenCanvas";
import {
  Pin,
  HoleData,
  getBoundaryIntersectionY,
} from "@/lib/greenCanvas.geometry";
import { useParams } from "next/navigation";
import api from "@/lib/axios";

export default function PinEditPage() {
  const { id } = useParams();
  const hole = id as string;
  const holeNumber = Number(hole);

  const [pastPins, setPastPins] = useState<Pin[]>([]);
  const [currentPin, setCurrentPin] = useState<Pin>({
    id: "new",
    x: 30,
    y: 35,
  });
  const [currentPinDbId, setCurrentPinDbId] = useState<string | null>(null);
  const [holeData, setHoleData] = useState<HoleData | null>(null);

  // グリーンデータ取得
  useEffect(() => {
    const paddedHole = hole.padStart(2, "0");
    fetch(`/greens/hole_${paddedHole}.json`)
      .then((res) => res.json())
      .then((data) => setHoleData(data))
      .catch((err) => console.error("JSON読み込みエラー:", err));
  }, [hole]);

  // APIからピン取得
  useEffect(() => {
    api.get(`/api/pins?hole_number=${holeNumber}`).then((response) => {
      const pins = response.data;
      if (pins.length > 0) {
        const latest = pins[pins.length - 1];
        setCurrentPin({ id: latest.id, x: latest.x, y: latest.y });
        setCurrentPinDbId(latest.id);
        setPastPins(
          pins.slice(0, -1).map((p: { id: string; x: number; y: number }) => ({
            id: p.id,
            x: p.x,
            y: p.y,
          })),
        );
      }
    });
  }, [holeNumber]);

  function handlePinDragged(newPin: Pin) {
    setCurrentPin(newPin);
  }

  async function handleSave() {
    if (currentPinDbId) {
      await api.delete(`/api/pins/${currentPinDbId}`);
    }
    const response = await api.post("/api/pins", {
      hole_number: holeNumber,
      x: currentPin.x,
      y: currentPin.y,
    });
    setCurrentPinDbId(response.data.id);
  }

  if (!holeData) {
    return <div>読み込み中...</div>;
  }

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
      {`奥行${depth}yd, ${horizontal}`}
      <button onClick={handleSave}>保存</button>
      <GreenCanvas
        hole={hole}
        currentPin={currentPin}
        pastPins={pastPins}
        onPinDragged={handlePinDragged}
      />
    </div>
  );
}
