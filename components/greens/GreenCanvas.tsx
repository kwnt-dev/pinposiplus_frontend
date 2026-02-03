"use client";

import { useEffect, useState } from "react";
import { Stage, Layer, Path, Line, Circle, Text, Rect } from "react-konva";

// 型定義
interface LayerData {
  type: string;
  d: string;
  fill: string;
}

interface Cell {
  id: string;
  x: number;
  y: number;
  centerX: number;
  centerY: number;
  isInside: boolean;
}
interface Pin {
  id: string;
  x: number;
  y: number;
}

interface HoleData {
  hole: string;
  boundary: { d: string };
  layers: LayerData[];
  origin: { x: number; y: number };
  cells: Cell[];
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
  damageCells?: string[];
  banCells?: string[];
  rainCells?: string[];
  onCellClick?: (cellId: string) => void;
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

export default function GreenCanvas({
  hole,
  width = 600,
  height = 600,
  damageCells = [],
  banCells = [],
  rainCells = [],
  onCellClick,
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
      <Layer
        onClick={(e) => {
          if (!onCellClick) return;
          const stage = e.target.getStage();
          if (!stage) return;
          const pos = stage.getPointerPosition();
          if (!pos) return;
          const x = Math.floor(pos.x / scale / YD_TO_PX);
          const y = Math.floor(pos.y / scale / YD_TO_PX);
          const cellId = `cell_${x}_${y}`;
          const cell = holeData.cells.find((c) => c.id === cellId);
          if (cell) {
            onCellClick(cellId);
          }
        }}
      >
        {/* 背景レイヤー */}
        {holeData.layers.map((layer, index) => (
          <Path
            key={`layer-${index}`}
            data={scalePathToPixels(layer.d)}
            fill={layer.fill}
          />
        ))}

        {/* グリッド（縦線） */}
        {Array.from({ length: 61 }, (_, i) => (
          <Line
            key={`grid-v-${i}`}
            points={[ydToPx(i), 0, ydToPx(i), CANVAS_SIZE]}
            stroke="rgba(0,0,0,0.15)"
            strokeWidth={1}
          />
        ))}

        {/* グリッド（横線） */}
        {Array.from({ length: 61 }, (_, i) => (
          <Line
            key={`grid-h-${i}`}
            points={[0, ydToPx(i), CANVAS_SIZE, ydToPx(i)]}
            stroke="rgba(0,0,0,0.15)"
            strokeWidth={1}
          />
        ))}

        {/* 外周線 */}
        <Path
          data={scalePathToPixels(holeData.boundary.d)}
          stroke="#000000"
          strokeWidth={2}
          fill="transparent"
        />

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

        {/* EXIT */}
        <Circle
          x={ydToPx(config.exit.x)}
          y={ydToPx(config.exit.y)}
          radius={20}
          fill="#f97316"
        />

        {/* 傷みセル */}
        {damageCells.map((cellId) => {
          const cell = holeData.cells.find((c) => c.id === cellId);
          if (!cell) return null;
          return (
            <Rect
              key={`damage-${cellId}`}
              x={ydToPx(cell.x)}
              y={ydToPx(cell.y)}
              width={YD_TO_PX}
              height={YD_TO_PX}
              fill="rgba(239, 68, 68, 0.7)"
            />
          );
        })}

        {/* 禁止セル */}
        {banCells.map((cellId) => {
          const cell = holeData.cells.find((c) => c.id === cellId);
          if (!cell) return null;
          return (
            <Rect
              key={`ban-${cellId}`}
              x={ydToPx(cell.x)}
              y={ydToPx(cell.y)}
              width={YD_TO_PX}
              height={YD_TO_PX}
              fill="rgba(75, 85, 99, 0.7)"
            />
          );
        })}

        {/* 雨天禁止セル */}
        {rainCells.map((cellId) => {
          const cell = holeData.cells.find((c) => c.id === cellId);
          if (!cell) return null;
          return (
            <Rect
              key={`rain-${cellId}`}
              x={ydToPx(cell.x)}
              y={ydToPx(cell.y)}
              width={YD_TO_PX}
              height={YD_TO_PX}
              fill="rgba(59, 130, 246, 0.7)"
            />
          );
        })}

        {/* 現在のピン */}
        {currentPin && (
          <Circle
            x={ydToPx(currentPin.x)}
            y={ydToPx(currentPin.y)}
            radius={20}
            fill="#000000"
          />
        )}
      </Layer>
    </Stage>
  );
}
