"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import GreenCanvas from "@/components/greens/GreenCanvas";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";

export default function StaffHoleEditPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const holeId = params.id as string;
  const holeNumber = Number(holeId);
  const sessionId = searchParams.get("session_id");

  const [pin, setPin] = useState<
    { id: string; x: number; y: number } | undefined
  >(undefined);
  const [pinDbId, setPinDbId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const loadPin = async () => {
      try {
        const res = await api.get(`/api/pin-sessions/${sessionId}`);
        const sessionPins = res.data.pins;
        const holePin = sessionPins.find(
          (p: { hole_number: number }) => p.hole_number === holeNumber,
        );
        if (holePin) {
          setPin({ id: holePin.id, x: holePin.x, y: holePin.y });
          setPinDbId(holePin.id);
        }
      } catch (err) {
        console.error("ピン取得エラー:", err);
      }
    };
    loadPin();
  }, [holeNumber, sessionId]);

  async function handleSave() {
    if (!pin || !sessionId) return;

    if (pinDbId) {
      await api.delete(`/api/pins/${pinDbId}`);
    }
    const response = await api.post("/api/pins", {
      hole_number: holeNumber,
      x: pin.x,
      y: pin.y,
      session_id: sessionId,
    });
    setPinDbId(response.data.id);
    alert("保存しました");
  }

  if (!sessionId) {
    return (
      <div className="p-8">
        <p className="text-gray-500">セッションが指定されていません</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Hole {holeId}</h1>
      <GreenCanvas
        hole={holeId}
        width={400}
        height={400}
        currentPin={pin}
        onPinDragged={(newPin) => setPin(newPin)}
      />
      <Button className="mt-4 w-full" onClick={handleSave}>
        ピンを保存
      </Button>
    </div>
  );
}
