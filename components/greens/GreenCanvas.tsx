"use client";

import { useEffect, useState } from "react";
import { Stage, Layer, Path, Line, Circle, Text } from "react-konva";

// 型定義
interface LayerData {
  type: string;
  d: string;
  fill: string;
}

interface HoleData {
  hole: string;
  boundary: { d: string };
  layers: LayerData[];
  origin: { x: number; y: number };
}

interface Props {
  hole: string;
  width?: number;
  height?: number;
}

// 定数
const YD_TO_PX = 20;
const CANVAS_SIZE = 60 * YD_TO_PX;

// ユーティリティ関数
function scalePathToPixels(d: string): string {
  return d.replace(/-?\d+\.?\d*(e[-+]?\d+)?/gi, (match) =>
    Math.round(parseFloat(match) * YD_TO_PX).toString(),
  );
}

function ydToPx(yd: number): number {
  return yd * YD_TO_PX;
}

export default function GreenCanvas({
  hole,
  width = 600,
  height = 600,
}: Props) {
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

  const scale = width / CANVAS_SIZE;

  return (
    <Stage width={width} height={height} scaleX={scale} scaleY={scale}>
      <Layer></Layer>
    </Stage>
  );
}
