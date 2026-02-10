"use client";

import { useRef } from "react";
import GreenCardGridPDFExport, {
  HolePin,
} from "@/components/greens/GreenCardGridPDFExport";

const testPins: HolePin[] = [
  { hole: 1, x: 30, y: 35 },
  { hole: 2, x: 25, y: 30 },
  { hole: 3, x: 35, y: 40 },
  { hole: 4, x: 28, y: 25 },
  { hole: 5, x: 32, y: 38 },
  { hole: 6, x: 30, y: 32 },
  { hole: 7, x: 26, y: 36 },
  { hole: 8, x: 34, y: 28 },
  { hole: 9, x: 30, y: 42 },
  { hole: 10, x: 28, y: 34 },
  { hole: 11, x: 33, y: 30 },
  { hole: 12, x: 30, y: 37 },
  { hole: 13, x: 27, y: 32 },
  { hole: 14, x: 35, y: 35 },
  { hole: 15, x: 30, y: 28 },
  { hole: 16, x: 31, y: 40 },
  { hole: 17, x: 25, y: 33 },
  { hole: 18, x: 30, y: 36 },
];

const CARD_SIZE = 240;

/**
 * Konvaグリッドを1枚の画像にまとめる
 */
async function exportGridToImage(
  gridRef: React.RefObject<HTMLDivElement | null>,
): Promise<string> {
  const el = gridRef.current;
  if (!el) return "";

  // グリッド構成
  const cols = 3;
  const rows = 3;
  const headerHeight = 40;
  const offset = 2; // strokeRectの線幅が端で切れるのを防ぐ

  // キャンバスサイズ計算
  const gridW = CARD_SIZE * cols;
  const gridH = CARD_SIZE * rows;
  const totalW = gridW + offset * 2;
  const totalH = headerHeight + gridH + offset * 2;

  // PDF印刷用に4倍解像度でcanvasを作成
  const canvas = document.createElement("canvas");
  const scale = 4;
  canvas.width = totalW * scale;
  canvas.height = totalH * scale;

  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale); // 座標系はtotalW x totalHのまま使える

  // canvasはデフォルト透明なので白で塗りつぶす
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, totalW, totalH);

  return canvas.toDataURL("image/png", 1.0);
}

export default function PDFPreviewPage() {
  const outRef = useRef<HTMLDivElement>(null);
  const inRef = useRef<HTMLDivElement>(null);

  return (
    <div className="p-8">
      <div className="mb-6">
        <button onClick={() => window.print()}>PDF</button>
      </div>

      <div className="mb-4">
        <div ref={outRef}>
          <GreenCardGridPDFExport
            course="out"
            pins={testPins}
            cardSize={CARD_SIZE}
          />
        </div>
      </div>

      <div>
        <div ref={inRef}>
          <GreenCardGridPDFExport
            course="in"
            pins={testPins}
            cardSize={CARD_SIZE}
          />
        </div>
      </div>
    </div>
  );
}
