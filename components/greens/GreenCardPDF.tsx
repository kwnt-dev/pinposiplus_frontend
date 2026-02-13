"use client";

import { useEffect, useState } from "react";
import { Stage, Layer, Path, Line, Circle, Text } from "react-konva";
import { Fragment } from "react";
import { HOLE_CONFIGS } from "@/config/holes";
import { Pin, HoleData } from "@/lib/greenCanvas.geometry";
import {
  getBoundaryIntersectionX,
  getBoundaryIntersectionY,
} from "@/lib/greenCanvas.geometry";
import {
  CANVAS_SIZE,
  scalePathToPixels,
  ydToPx,
} from "@/lib/greenCanvas.convert";

interface Props {
  hole: string;
  width?: number;
  height?: number;
  currentPin?: Pin;
}

// 定数
const DEPTH_FONT_SIZE = 80;
const HORIZONTAL_FONT_SIZE = 40;

export default function GreenCardPDF({
  hole,
  width = 240,
  height = 240,
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
  const config = HOLE_CONFIGS[hole.padStart(2, "0")];
  const edges = getBoundaryIntersectionY(
    holeData.boundary.d,
    currentPin?.y ?? 0,
  );

  const centerLineEdges = getBoundaryIntersectionX(holeData.boundary.d, 30);

  return (
    <div className="w-[240px]">
      <div
        className="h-10 bg-gray-800 text-white font-bold text-center flex items-center justify-center"
        style={{ width: 240 }}
      >
        Hole {hole}
      </div>
      <div className="border-l border-r border-b border-gray-300 overflow-hidden">
        <Stage width={240} height={240}>
          <Layer scaleX={scale} scaleY={scale}>
            {/* バンカーとウォーターハザード */}
            {holeData.layers
              .filter(
                (layer) => layer.type === "bunker" || layer.type === "water",
              )
              .map((layer, index) => (
                <Path
                  key={`layer-${index}`}
                  data={scalePathToPixels(layer.d)}
                  stroke="#000000"
                  strokeWidth={3}
                  fill="transparent"
                />
              ))}
            {/* 外周線 */}
            <Path
              data={scalePathToPixels(holeData.boundary.d)}
              stroke="#000000"
              strokeWidth={6}
              fill="transparent"
            />
            {/* 傾斜線 */}
            {holeData.slope ? (
              <Path
                data={scalePathToPixels(holeData.slope.slope.d)}
                stroke="#000000"
                strokeWidth={3}
                fill="transparent"
              />
            ) : null}
            {/* 座標線 */}
            {[0, 10, 20, 30, 40, 50].map((depth) => {
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
            {centerLineEdges && (
              <Line
                points={[
                  ydToPx(30),
                  ydToPx(centerLineEdges.top),
                  ydToPx(30),
                  ydToPx(holeData.origin.y),
                ]}
                stroke="#000000"
                strokeWidth={3}
              />
            )}

            {/* 現在のピン */}
            {currentPin && (
              <Circle
                x={ydToPx(currentPin.x)}
                y={ydToPx(currentPin.y)}
                radius={10}
                fill="#000000"
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
                  strokeWidth={6}
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
                    strokeWidth={6}
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

            {/* 中心線上の表示「C」 */}
            {currentPin && currentPin.x === 30 && (
              <Text
                text="C"
                fontSize={40}
                x={ydToPx(currentPin.x) * scale - 60}
                y={ydToPx(currentPin.y) * scale - 60}
                fontStyle="bold"
                fill="#000000"
              />
            )}

            {/* 横数字 */}
            {currentPin &&
              currentPin.x !== 30 &&
              edges &&
              (() => {
                const distance = Math.round(
                  currentPin.x < 30
                    ? currentPin.x - edges.left
                    : edges.right - currentPin.x,
                );
                const text = `${distance}`;
                const textWidth = HORIZONTAL_FONT_SIZE * text.length * 0.6;
                const margin = 5;
                const cardWidth = width;

                let x: number;
                let y = ydToPx(currentPin.y) * scale;

                if (currentPin.x < 30) {
                  x = ydToPx(edges.left) * scale - margin - textWidth;
                  if (x < 0) {
                    x = margin;
                    y = y - HORIZONTAL_FONT_SIZE;
                  }
                } else {
                  x = ydToPx(edges.right) * scale + margin;
                  if (x + textWidth > cardWidth) {
                    x = cardWidth - textWidth - margin;
                    y = y - HORIZONTAL_FONT_SIZE;
                  }
                }

                return (
                  <Text
                    x={x}
                    y={y}
                    offsetY={HORIZONTAL_FONT_SIZE / 2}
                    text={text}
                    fontSize={HORIZONTAL_FONT_SIZE}
                    fontStyle="bold"
                    fill="#000000"
                  />
                );
              })()}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
