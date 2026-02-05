"use client";

import { useEffect, useState } from "react";
import {
  Stage,
  Layer,
  Path,
  Line,
  Circle,
  Group,
  Text,
  Rect,
} from "react-konva";

// 型定義
interface LayerData {
  type: string;
  d: string;
  fill: string;
}

export interface Pin {
  id: string;
  x: number;
  y: number;
}

interface HoleData {
  hole: string;
  boundary: { d: string };
  layers: LayerData[];
  origin: { x: number; y: number };
  slope: {
    slope: { d: string };
  } | null;
}

interface HoleConfig {
  exit: { x: number; y: number };
  centerLineMarks: {
    front: { x: number; y: number };
    back: { x: number; y: number };
  };
}

const HOLE_01_CONFIG: HoleConfig = {
  exit: { x: 10, y: 16 },
  centerLineMarks: { front: { x: 30, y: 57 }, back: { x: 30, y: 17 } },
};

interface Props {
  hole: string;
  width?: number;
  height?: number;
  currentPin?: Pin;
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

export default function GreenCardPDF({
  hole,
  width = 600,
  height = 600,
  currentPin,
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
  const config = HOLE_01_CONFIG;

  return (
    <Stage width={width} height={height} scaleX={scale} scaleY={scale}>
      <Layer>
        {/* バンカーとウォーターハザード */}
        {holeData.layers
          .filter((layer) => layer.type === "bunker" || layer.type === "water")
          .map((layer, index) => (
            <Path
              key={`layer-${index}`}
              data={scalePathToPixels(layer.d)}
              stroke="#000000"
              strokeWidth={2}
              fill="transparent"
            />
          ))}

        {/* 外周線 */}
        <Path
          data={scalePathToPixels(holeData.boundary.d)}
          stroke="#000000"
          strokeWidth={2}
          fill="transparent"
        />

        {/* 傾斜線 */}

        {holeData.slope ? (
          <Path
            data={scalePathToPixels(holeData.slope.slope.d)}
            stroke="#000000"
            strokeWidth={2}
            fill="transparent"
          />
        ) : null}

        {/* 座標線 */}
        {[0, 10, 20, 30, 40].map((depth) => {
          const y = holeData.origin.y - depth;
          return (
            <Line
              key={`depth-${depth}`}
              points={[0, ydToPx(y), CANVAS_SIZE, ydToPx(y)]}
              stroke="#000000"
              strokeWidth={2}
            />
          );
        })}

        {/* 座標線ラベル */}
        {[0, 10, 20, 30, 40].map((depth) => {
          const y = holeData.origin.y - depth;
          return (
            <Text
              key={`label-${depth}`}
              x={CANVAS_SIZE - 50}
              y={ydToPx(y) - 25}
              text={`${depth}`}
              fontSize={25}
              fontStyle="bold"
              fill="#000000"
            />
          );
        })}

        {/* 中心線 */}
        <Line
          points={[
            ydToPx(config.centerLineMarks.front.x),
            ydToPx(config.centerLineMarks.front.y),
            ydToPx(config.centerLineMarks.back.x),
            ydToPx(config.centerLineMarks.back.y),
          ]}
          stroke="#000000"
          strokeWidth={2}
          dash={[10, 5]}
        />

        {/* 現在のピン */}
        {currentPin && (
          <Circle
            x={ydToPx(currentPin.x)}
            y={ydToPx(currentPin.y)}
            radius={20}
            fill="#ef4444"
          />
        )}
      </Layer>
    </Stage>
  );
}
