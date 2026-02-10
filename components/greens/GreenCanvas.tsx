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
import { Fragment } from "react";
import ClipperLib from "clipper-lib";
import { HOLE_CONFIGS } from "@/config/holes";

// 型定義
interface LayerData {
  type: string;
  d: string;
  fill: string;
}

export interface Cell {
  id: string;
  x: number;
  y: number;
  centerX: number;
  centerY: number;
  isInside: boolean;
}
export interface Pin {
  id: string;
  x: number;
  y: number;
}

interface PinHistory {
  id: string;
  x: number;
  y: number;
}

export interface HoleData {
  hole: string;
  boundary: { d: string };
  layers: LayerData[];
  origin: { x: number; y: number };
  cells: Cell[];
  slope: {
    upper: { d: string };
    lower: { d: string };
    slope: { d: string };
  } | null;
}

interface Props {
  hole: string;
  width?: number;
  height?: number;
  damageCells?: string[];
  banCells?: string[];
  rainCells?: string[];
  onCellClick?: (cellId: string) => void;
  currentPin?: Pin;
  onPinDragged?: (currentPin: Pin) => void;
  pastPins?: Pin[];
  suggestedPins?: { x: number; y: number }[];
}

// 定数
const YD_TO_PX = 20;
const CANVAS_SIZE = 60 * YD_TO_PX;
const PAST_PIN_RESTRICTION_RADIUS = 7; // 過去ピン制限　半径yd
const BOUNDARY_BUFFER = 3.5; // 外周制限距離（ヤード）
const SLOPE_BUFFER = 3;

// ユーティリティ関数
function scalePathToPixels(d: string): string {
  return d.replace(/-?\d+\.?\d*(e[-+]?\d+)?/gi, (match) =>
    Math.round(parseFloat(match) * YD_TO_PX).toString(),
  );
}

function ydToPx(yd: number): number {
  return yd * YD_TO_PX;
}

/**
 * グリーン内外判定
 * JSONのisInsideを使用（svg→jsonで内側のセルのみ生成）
 * エッジケース：外周線と重なるセルは四隅判定で対応
 */
function isInsideGreen(pin: Pin, cells: Cell[]): boolean {
  // ピン位置の四隅のセルをチェック
  const surroundingCells = [
    { x: Math.floor(pin.x) - 1, y: Math.floor(pin.y) - 1 },
    { x: Math.floor(pin.x), y: Math.floor(pin.y) - 1 },
    { x: Math.floor(pin.x) - 1, y: Math.floor(pin.y) },
    { x: Math.floor(pin.x), y: Math.floor(pin.y) },
  ];

  const allInside = surroundingCells.every((c) => {
    const cell = cells.find((cell) => cell.x === c.x && cell.y === c.y);
    return cell && cell.isInside;
  });

  return allInside;
}

// SVGベジェ曲線上の1点の座標を計算する関数
export function calcBezierPoint(
  t: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number,
): number {
  const mt = 1 - t;
  return (
    mt * mt * mt * p0 +
    3 * mt * mt * t * p1 +
    3 * mt * t * t * p2 +
    t * t * t * p3
  );
}

// SVGパス文字列を点配列に変換する（ベジェ曲線は直線近似）関数
export function svgPathToPoints(
  d: string,
  segments = 40,
): { x: number; y: number }[] {
  // パスをコマンドと数字に分解
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+/g);
  if (!tokens) return [];

  const pts: { x: number; y: number }[] = [];
  let cx = 0;
  let cy = 0;
  let startX = 0;
  let startY = 0;
  let cmd: string | null = null;
  let i = 0;

  const isLetter = (tok: string) => /^[a-zA-Z]$/.test(tok);

  while (i < tokens.length) {
    const tok = tokens[i];

    if (isLetter(tok)) {
      cmd = tok;
      i++;
    }

    if (!cmd) break;

    // M: 開始点
    if (cmd === "m" || cmd === "M") {
      if (i + 1 >= tokens.length) break;
      const x = parseFloat(tokens[i++]);
      const y = parseFloat(tokens[i++]);
      if (cmd === "m") {
        cx += x;
        cy += y;
      } else {
        cx = x;
        cy = y;
      }
      startX = cx;
      startY = cy;
      pts.push({ x: cx, y: cy });

      // C: ベジェ曲線（segments個の点に分割）
    } else if (cmd === "c" || cmd === "C") {
      while (i + 5 < tokens.length && !isLetter(tokens[i])) {
        const dx1 = parseFloat(tokens[i++]);
        const dy1 = parseFloat(tokens[i++]);
        const dx2 = parseFloat(tokens[i++]);
        const dy2 = parseFloat(tokens[i++]);
        const dx = parseFloat(tokens[i++]);
        const dy = parseFloat(tokens[i++]);

        let c1x: number,
          c1y: number,
          c2x: number,
          c2y: number,
          ex: number,
          ey: number;

        if (cmd === "c") {
          c1x = cx + dx1;
          c1y = cy + dy1;
          c2x = cx + dx2;
          c2y = cy + dy2;
          ex = cx + dx;
          ey = cy + dy;
        } else {
          c1x = dx1;
          c1y = dy1;
          c2x = dx2;
          c2y = dy2;
          ex = dx;
          ey = dy;
        }

        for (let k = 0; k <= segments; k++) {
          const t = k / segments;
          const x = calcBezierPoint(t, cx, c1x, c2x, ex);
          const y = calcBezierPoint(t, cy, c1y, c2y, ey);
          pts.push({ x, y });
        }

        cx = ex;
        cy = ey;
      }

      // z: パスを閉じる
    } else if (cmd === "z" || cmd === "Z") {
      pts.push({ x: startX, y: startY });
      i++;
    } else {
      break;
    }
  }

  return pts;
}

// 境界線から内側にオフセットした境界を生成する関数
export function getOffsetBoundary(
  boundaryD: string,
  offsetYd: number,
): { x: number; y: number }[] {
  const polygon = svgPathToPoints(boundaryD, 80);
  if (polygon.length < 3) return [];

  const SCALE = 1000;
  const clipperPath: ClipperLib.IntPoint[] = polygon.map((p) => ({
    X: Math.round(p.x * SCALE),
    Y: Math.round(p.y * SCALE),
  }));

  const co = new ClipperLib.ClipperOffset();
  co.AddPath(
    clipperPath,
    ClipperLib.JoinType.jtRound,
    ClipperLib.EndType.etClosedPolygon,
  );

  const solution: ClipperLib.IntPoint[][] = [];
  co.Execute(solution, -offsetYd * SCALE);

  if (solution.length === 0 || solution[0].length === 0) return [];

  return solution[0].map((p) => ({
    x: p.X / SCALE,
    y: p.Y / SCALE,
  }));
}

// 傾斜線から両側にオフセットした境界を生成する関数
export function getOffsetSlope(
  slopeD: string,
  offsetYd: number,
): { x: number; y: number }[] {
  const polygon = svgPathToPoints(slopeD, 80);
  if (polygon.length < 3) return [];

  const SCALE = 1000;
  const clipperPath: ClipperLib.IntPoint[] = polygon.map((p) => ({
    X: Math.round(p.x * SCALE),
    Y: Math.round(p.y * SCALE),
  }));

  const co = new ClipperLib.ClipperOffset();
  co.AddPath(
    clipperPath,
    ClipperLib.JoinType.jtRound,
    ClipperLib.EndType.etOpenRound,
  );

  const solution: ClipperLib.IntPoint[][] = [];
  co.Execute(solution, offsetYd * SCALE);

  if (solution.length === 0 || solution[0].length === 0) return [];

  return solution[0].map((p) => ({
    x: p.X / SCALE,
    y: p.Y / SCALE,
  }));
}

// ポリゴン内にピンがあるか判定する関数
export function isPointInPolygon(
  x: number,
  y: number,
  polygon: { x: number; y: number }[],
): boolean {
  if (polygon.length < 3) return false;

  const SCALE = 1000;
  const point: ClipperLib.IntPoint = {
    X: Math.round(x * SCALE),
    Y: Math.round(y * SCALE),
  };

  const clipperPath: ClipperLib.IntPoint[] = polygon.map((p) => ({
    X: Math.round(p.x * SCALE),
    Y: Math.round(p.y * SCALE),
  }));

  const result = ClipperLib.Clipper.PointInPolygon(point, clipperPath);
  return result !== 0;
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
  onPinDragged,
  pastPins,
  suggestedPins = [],
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
  const config = HOLE_CONFIGS[hole.padStart(2, "0")];

  //外周制限を計算
  const boundaryBufferPoints = getOffsetBoundary(
    holeData.boundary.d,
    BOUNDARY_BUFFER,
  );

  //傾斜制限を計算

  const slopeBufferPoints = holeData.slope
    ? getOffsetSlope(holeData.slope.slope.d, SLOPE_BUFFER)
    : [];

  console.log("GreenCanvas ban:", banCells, "rain:", rainCells, "hole:", hole);
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

        {/* グリーン上段 */}

        {holeData.slope ? (
          <Path
            data={scalePathToPixels(holeData.slope.upper.d)}
            fill="#7ed9a0"
          />
        ) : null}

        {/* グリーン下段 */}

        {holeData.slope ? (
          <Path
            data={scalePathToPixels(holeData.slope.lower.d)}
            fill="#5fb8a0"
          />
        ) : null}

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

        {/* 外周制限エリア */}
        <Group
          clipFunc={() => {
            return [new Path2D(scalePathToPixels(holeData.boundary.d))];
          }}
        >
          <Path
            data={scalePathToPixels(holeData.boundary.d)}
            stroke="rgba(255, 150, 150, 0.4)"
            strokeWidth={ydToPx(BOUNDARY_BUFFER * 2)}
          />
        </Group>

        {/* 傾斜線 */}

        {holeData.slope ? (
          <Path
            data={scalePathToPixels(holeData.slope.slope.d)}
            stroke="#000000"
            strokeWidth={2}
            fill="transparent"
          />
        ) : null}

        {/* 傾斜制限エリア */}
        {holeData.slope ? (
          <Group
            clipFunc={() => {
              return [new Path2D(scalePathToPixels(holeData.boundary.d))];
            }}
          >
            <Path
              data={scalePathToPixels(holeData.slope.slope.d)}
              stroke="rgba(0, 0, 0, 0.15)"
              strokeWidth={ydToPx(SLOPE_BUFFER * 2)}
              lineCap="round"
            />
          </Group>
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
        {[0, 10, 20, 30, 40, 50].map((depth) => {
          const y = holeData.origin.y - depth;
          return (
            <Text
              key={`label-${depth}`}
              x={CANVAS_SIZE - 95}
              y={ydToPx(y) - 60}
              text={`${depth}`}
              fontSize={60}
              width={80}
              align="right"
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

        {/* セル描画（外周でクリップ） */}
        <Group
          clipFunc={() => {
            return [new Path2D(scalePathToPixels(holeData.boundary.d))];
          }}
        >
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
        </Group>

        {/* 過去ピン */}
        {pastPins &&
          pastPins.map((pin) => (
            <Fragment key={`pastPin-${pin.id}`}>
              {/* 制限円 */}
              <Circle
                x={ydToPx(pin.x)}
                y={ydToPx(pin.y)}
                radius={PAST_PIN_RESTRICTION_RADIUS * YD_TO_PX}
                fill={`rgb(0, 0, 0, 0.08)`}
              />
              {/* 過去ピン */}
              <Circle
                x={ydToPx(pin.x)}
                y={ydToPx(pin.y)}
                radius={20}
                fill="#6b7280"
              />
            </Fragment>
          ))}

        {/* 過去ピン出口線 */}
        {pastPins &&
          pastPins.map((pin) => (
            <Line
              key={`exit-${pin.id}`}
              points={[
                ydToPx(pin.x),
                ydToPx(pin.y),
                ydToPx(config.exit.x),
                ydToPx(config.exit.y),
              ]}
              stroke="#f97316"
              strokeWidth={2}
              dash={[10, 5]}
            />
          ))}

        {/* 候補ピン */}
        {suggestedPins?.map((pin, i) => (
          <Circle
            key={`suggest-${i}`}
            x={ydToPx(pin.x)}
            y={ydToPx(pin.y)}
            radius={5}
            fill="#ef4444"
            opacity={1}
          />
        ))}

        {/* 現在のピン */}
        {currentPin && (
          <Circle
            x={ydToPx(currentPin.x)}
            y={ydToPx(currentPin.y)}
            radius={20}
            fill="#ef4444"
            draggable
            onDragEnd={(e) => {
              const newX = e.target.x() / YD_TO_PX;
              const newY = e.target.y() / YD_TO_PX;

              console.log("newX:", newX, "newY:", newY);
              console.log(
                "isInside:",
                isInsideGreen(
                  { id: currentPin.id, x: newX, y: newY },
                  holeData.cells,
                ),
              );

              if (
                isInsideGreen(
                  { id: currentPin.id, x: newX, y: newY },
                  holeData.cells,
                ) &&
                isPointInPolygon(newX, newY, boundaryBufferPoints) &&
                !isPointInPolygon(newX, newY, slopeBufferPoints)
              ) {
                onPinDragged?.({
                  id: currentPin.id,
                  x: newX,
                  y: newY,
                });
              } else {
                // グリーン外または外周制限内なら元の位置に戻す
                e.target.x(ydToPx(currentPin.x));
                e.target.y(ydToPx(currentPin.y));
              }
            }}
          />
        )}

        {/* 現在ピン出口線 */}
        {currentPin && (
          <Line
            points={[
              ydToPx(currentPin.x),
              ydToPx(currentPin.y),
              ydToPx(config.exit.x),
              ydToPx(config.exit.y),
            ]}
            stroke="#ef4444"
            strokeWidth={2}
            dash={[10, 5]}
          />
        )}
      </Layer>
    </Stage>
  );
}
