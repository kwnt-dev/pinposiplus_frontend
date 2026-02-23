"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import GreenCanvas from "@/components/greens/GreenCanvas";
import api from "@/lib/axios";

export default function StaffHoleEditPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const holeId = params.id as string;
  const holeNumber = Number(holeId);
  const sessionId = searchParams.get("session_id");

  const [pin, setPin] = useState<
    { id: string; x: number; y: number } | undefined
  >(undefined);
  const [pinDbId, setPinDbId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState(400);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setCanvasSize(Math.floor(Math.min(width, height)));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

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
  }

  if (!sessionId) return null;

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <header className="flex-shrink-0 h-14 px-4 bg-white border-b flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← 戻る
        </button>
        <h1 className="text-lg font-bold">Hole {holeId}</h1>
        <button
          onClick={handleSave}
          className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-all"
        >
          保存
        </button>
      </header>

      <main
        ref={containerRef}
        className="flex-1 min-h-0 flex items-center justify-center p-4"
      >
        <GreenCanvas
          hole={holeId}
          width={canvasSize}
          height={canvasSize}
          currentPin={pin}
          onPinDragged={(newPin) => setPin(newPin)}
        />
      </main>
    </div>
  );
}
