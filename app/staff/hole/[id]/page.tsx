"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import GreenCanvas from "@/components/greens/GreenCanvas";
import { ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/axios";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { getPinSessionDetail } from "@/lib/pinSession";
import { useContainerSize } from "@/hooks/useContainerSize";
import { useHoleData } from "@/hooks/useHoleData";
import { getBoundaryIntersectionY } from "@/lib/greenCanvas.geometry";

/** スタッフ用ホール個別編集ページ（ピン位置の確認・修正・保存） */
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

  const [pin, setPin] = useState
    { id: string; x: number; y: number } | undefined
  >(undefined);
  const [pinDbId, setPinDbId] = useState<string | null>(null);
  const [isRainyDay, setIsRainyDay] = useState(false);
  const [banCells, setBanCells] = useState<string[]>([]);
  const [damageCells, setDamageCells] = useState<string[]>([]);
  const [rainCells, setRainCells] = useState<string[]>([]);
  const [pastPins, setPastPins] = useState
    { id: string; x: number; y: number; date?: string }[]
  >([]);
  const [containerRef, containerSize] = useContainerSize();
  const canvasSize =
    Math.floor(Math.min(containerSize.width, containerSize.height)) || 400;
  const holeData = useHoleData(holeId);

  // ゴルフ場座標（PDF版と同じ: 奥行き + グリーンエッジからの左右距離）
  const pinLabel = (() => {
    if (!pin || !holeData) return null;
    const depth = Math.round(holeData.origin.y - pin.y);
    if (pin.x === 30) return `奥${depth}yd 中心`;
    const edges = getBoundaryIntersectionY(holeData.boundary.d, pin.y);
    if (!edges) return `奥${depth}yd`;
    const side = pin.x < 30 ? "左" : "右";
    const dist = Math.round(
      pin.x < 30 ? pin.x - edges.left : edges.right - pin.x,
    );
    return `奥${depth}yd ${side}${dist}yd`;
  })();

  useEffect(() => {
    if (!sessionId) return;

    const loadPin = async () => {
      try {
        const detail = await getPinSessionDetail(sessionId);
        setIsRainyDay(detail.is_rainy ?? false);
        const sessionPins = detail.pins;
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
        setPastPins(
          (res.data.past_pins[holeKey] || []).map(
            (p: { x: number; y: number; date?: string }, i: number) => ({
              id: `past${i + 1}`,
              x: p.x,
              y: p.y,
              date: p.date,
            }),
          ),
        );
      } catch (err) {
        console.error("セルデータ取得エラー:", err);
      }
    };
    loadCells();
  }, [holeNumber]);

  // ピン保存（既存ピンを削除→新しい位置で再作成）
  async function handleSave() {
    if (!pin || !sessionId) return;

    try {
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
      toast.success("ピンを保存しました");
    } catch (err) {
      console.error("ピン保存エラー:", err);
      toast.error("保存に失敗しました");
    }
  }

  function navigateHole(hole: number) {
    router.push(`/staff/hole/${hole}?session_id=${sessionId}`);
  }

  if (!sessionId) return null;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <header className="flex-shrink-0 min-h-14 py-1 px-4 bg-card border-b flex items-center justify-between">
        <button
          onClick={() => router.push(isOut ? "/staff/out" : "/staff/in")}
          className="text-sm font-medium text-muted-foreground"
        >
          ← 戻る
        </button>
        <div className="flex flex-col items-center">
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
          {pinLabel && (
            <span className="text-sm font-semibold text-foreground">
              {pinLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-bold"
          >
            保存
          </button>
        </div>
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
          rainCells={isRainyDay ? rainCells : []}
          pastPins={pastPins}
          isRainyDay={isRainyDay}
          onPinPlaced={(newPin) => setPin(newPin)}
        />
      </main>
    </div>
  );
}