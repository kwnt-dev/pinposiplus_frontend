"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import GreenCanvas from "@/components/greens/GreenCanvas";
import { ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/axios";

export default function StaffHoleEditPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const holeId = params.id as string;
  const holeNumber = Number(holeId);
  const sessionId = searchParams.get("session_id");

  const isOut = holeNumber >= 1 && holeNumber <= 9;
  const minHole = isOut ? 1 : 10;
  const maxHole = isOut ? 9 : 18;
  const hasPrev = holeNumber > minHole;
  const hasNext = holeNumber < maxHole;

  const [pin, setPin] = useState<
    { id: string; x: number; y: number } | undefined
  >(undefined);
  const [pinDbId, setPinDbId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState(400);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRainyDay, setIsRainyDay] = useState(false);
  const [banCells, setBanCells] = useState<string[]>([]);
  const [damageCells, setDamageCells] = useState<string[]>([]);
  const [rainCells, setRainCells] = useState<string[]>([]);

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
        setIsRainyDay(res.data.is_rainy ?? false);
        const sessionPins = res.data.pins;
        const holePin = sessionPins.find(
          (p: { hole_number: number }) => p.hole_number === holeNumber,
        );
        if (holePin) {
          setPin({ id: holePin.id, x: holePin.x, y: holePin.y });
          setPinDbId(holePin.id);
        } else {
          setPin(undefined);
          setPinDbId(null);
        }
      } catch (err) {
        console.error("ピン取得エラー:", err);
      }
    };
    loadPin();
  }, [holeNumber, sessionId]);

  useEffect(() => {
    const loadCells = async () => {
      try {
        const res = await api.get("/api/auto-suggest-data");
        const holeKey = String(holeNumber);
        setBanCells(
          (res.data.ban_cells[holeKey] || []).map(
            (c: { x: number; y: number }) => `cell_${c.x}_${c.y}`,
          ),
        );
        setDamageCells(
          (res.data.damage_cells[holeKey] || []).map(
            (c: { x: number; y: number }) => `cell_${c.x}_${c.y}`,
          ),
        );
        setRainCells(
          (res.data.rain_cells[holeKey] || []).map(
            (c: { x: number; y: number }) => `cell_${c.x}_${c.y}`,
          ),
        );
      } catch (err) {
        console.error("セルデータ取得エラー:", err);
      }
    };
    loadCells();
  }, [holeNumber]);

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

  function navigateHole(hole: number) {
    router.push(`/staff/hole/${hole}?session_id=${sessionId}`);
  }

  if (!sessionId) return null;

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <header className="flex-shrink-0 h-14 px-4 bg-white border-b flex items-center justify-between">
        <button
          onClick={() => router.push(isOut ? "/staff/out" : "/staff/in")}
          className="text-sm font-medium text-gray-600"
        >
          ← 戻る
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => hasPrev && navigateHole(holeNumber - 1)}
            disabled={!hasPrev}
            className="p-1 rounded disabled:opacity-30"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-bold">Hole {holeId}</h1>
          <button
            onClick={() => hasNext && navigateHole(holeNumber + 1)}
            disabled={!hasNext}
            className="p-1 rounded disabled:opacity-30"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-bold"
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
          damageCells={damageCells}
          banCells={banCells}
          rainCells={rainCells}
          isRainyDay={isRainyDay}
          onPinDragged={(newPin) => setPin(newPin)}
        />
      </main>
    </div>
  );
}
