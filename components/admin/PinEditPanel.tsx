"use client";

import GreenCanvas from "@/components/greens/GreenCanvas";
import { HolePin, Pin } from "@/lib/greenCanvas.geometry";
import { Button } from "@/components/ui/button";
import { MapPin, Save } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface PinEditPanelProps {
  editingHole: number;
  editingPin: HolePin | undefined;
  damageCells: string[];
  banCells: string[];
  rainCells: string[];
  pastPins: Pin[];
  onPinDragged: (pin: { id: string; x: number; y: number }) => void;
  onPinSave: () => void;
  readOnly?: boolean;
  isRainyDay?: boolean;
}

export default function PinEditPanel({
  editingHole,
  editingPin,
  damageCells,
  banCells,
  rainCells,
  pastPins,
  onPinDragged,
  onPinSave,
  readOnly = false,
  isRainyDay = false,
}: PinEditPanelProps) {
  const [showDamage, setShowDamage] = useState(true);
  const [showBan, setShowBan] = useState(true);
  const [showRain, setShowRain] = useState(true);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(400);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize(Math.floor(Math.min(width, height)));
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex-1 min-w-0 bg-card rounded-xl shadow-sm border overflow-hidden flex flex-col">
      {/* ヘッダーバー */}
      <div className="flex-shrink-0 h-[42px] px-4 bg-blue-600 flex items-center gap-2">
        <MapPin size={16} className="text-white" />
        <h2 className="text-sm font-bold text-white">
          ピン編集 - Hole {editingHole}
        </h2>
      </div>

      {/* 表示トグル + 保存 */}
      <div className="flex-shrink-0 px-4 py-2 bg-muted border-b flex items-center gap-2">
        <Button
          size="sm"
          variant={showDamage ? "default" : "outline"}
          onClick={() => setShowDamage(!showDamage)}
        >
          傷み
        </Button>
        <Button
          size="sm"
          variant={showBan ? "default" : "outline"}
          onClick={() => setShowBan(!showBan)}
        >
          禁止
        </Button>
        <Button
          size="sm"
          variant={showRain ? "default" : "outline"}
          onClick={() => setShowRain(!showRain)}
        >
          雨天
        </Button>

        <div className="flex-1" />

        {!readOnly && (
          <Button size="sm" onClick={onPinSave}>
            <Save size={14} className="mr-1" />
            保存
          </Button>
        )}
      </div>

      {/* キャンバス */}
      <div
        ref={canvasContainerRef}
        className="flex-1 min-h-0 flex items-center justify-center p-2"
      >
        <GreenCanvas
          hole={String(editingHole)}
          width={canvasSize}
          height={canvasSize}
          damageCells={showDamage ? damageCells : []}
          banCells={showBan ? banCells : []}
          rainCells={showRain ? rainCells : []}
          pastPins={pastPins}
          currentPin={
            editingPin
              ? {
                  id: `pin-${editingHole}`,
                  x: editingPin.x,
                  y: editingPin.y,
                }
              : undefined
          }
          onPinDragged={readOnly ? undefined : onPinDragged}
          isRainyDay={isRainyDay}
        />
      </div>
    </div>
  );
}
