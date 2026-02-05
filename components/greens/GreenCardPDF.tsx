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
const DEPTH_FONT_SIZE = 200;
const HORIZONTAL_FONT_SIZE = 100;

// ユーティリティ関数
function scalePathToPixels(d: string): string {
  return d.replace(/-?\d+\.?\d*(e[-+]?\d+)?/gi, (match) =>
    Math.round(parseFloat(match) * YD_TO_PX).toString(),
  );
}

function ydToPx(yd: number): number {
  return yd * YD_TO_PX;
}

// SVGベジェ曲線上の1点の座標を計算する関数
function calcBezierPoint(
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
function svgPathToPoints(d: string, segments = 40): { x: number; y: number }[] {
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

function getBoundaryIntersectionY(
  d: string,
  pinY: number,
): { left: number; right: number } | null {
  const polygon = svgPathToPoints(d, 80);
  if (polygon.length < 3) return null;

  const intersections: number[] = [];

  for (let i = 0; i < polygon.length - 1; i++) {
    const p1 = polygon[i];
    const p2 = polygon[i + 1];

    if ((p1.y <= pinY && p2.y >= pinY) || (p1.y >= pinY && p2.y <= pinY)) {
      if (Math.abs(p2.y - p1.y) < 0.001) {
        intersections.push(p1.x, p2.x);
      } else {
        const t = (pinY - p1.y) / (p2.y - p1.y);
        const x = p1.x + t * (p2.x - p1.x);
        intersections.push(x);
      }
    }
  }

  if (intersections.length < 2) return null;

  const left = Math.min(...intersections);
  const right = Math.max(...intersections);

  return { left, right };
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
  const edges = getBoundaryIntersectionY(
    holeData.boundary.d,
    currentPin?.y ?? 0,
  );

  return (
    <Stage width={width} height={height}>
      <Layer scaleX={scale} scaleY={scale}>
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
        {/* 逆L字線 */}

        {currentPin && (
          <Fragment key={`currentPin-${currentPin.id}`}>
            <Line
              points={[
                ydToPx(currentPin.x),
                ydToPx(currentPin.y),
                ydToPx(currentPin.x),
                ydToPx(holeData.origin.y),
              ]}
              stroke="#000000"
              strokeWidth={2}
            />
            {currentPin.x !== 30 && edges && (
              <Line
                points={[
                  ydToPx(currentPin.x),
                  ydToPx(currentPin.y),
                  ydToPx(currentPin.x < 30 ? edges.left : edges.right),
                  ydToPx(currentPin.y),
                ]}
                stroke="#000000"
                strokeWidth={2}
              />
            )}
          </Fragment>
        )}
      </Layer>

      {/* 数字用（scaleなし） */}

      <Layer>
        {/* 奥行き数字 */}
        {currentPin && (
          <Text
            text={`${Math.round(holeData.origin.y - currentPin.y)}`}
            fontSize={DEPTH_FONT_SIZE}
            x={currentPin.x <= 30 ? ydToPx(45) * scale : ydToPx(15) * scale}
            y={ydToPx(currentPin.y) * scale}
            offsetY={DEPTH_FONT_SIZE / 2}
            align="center"
            width={DEPTH_FONT_SIZE * 2}
            offsetX={DEPTH_FONT_SIZE}
            fontStyle="bold"
            fill="#000000"
          />
        )}

        {/* 横数字 */}
        {currentPin && currentPin.x !== 30 && edges && (
          <Text
            x={
              currentPin.x < 30
                ? ydToPx(edges.left) * scale - HORIZONTAL_FONT_SIZE
                : ydToPx(edges.right) * scale + 10
            }
            y={ydToPx(currentPin.y) * scale}
            offsetY={HORIZONTAL_FONT_SIZE / 2}
            text={`${Math.round(
              currentPin.x < 30
                ? currentPin.x - edges.left
                : edges.right - currentPin.x,
            )}`}
            fontSize={HORIZONTAL_FONT_SIZE}
            fontStyle="bold"
            fill="#000000"
          />
        )}
      </Layer>
    </Stage>
  );
}
