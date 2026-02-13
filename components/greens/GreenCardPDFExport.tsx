"use client";

import { useEffect, useState } from "react";
import { Stage, Layer, Path, Line, Circle, Text, Rect } from "react-konva";
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

// 丸数字
const CIRCLE_NUMBERS = [
  "①",
  "②",
  "③",
  "④",
  "⑤",
  "⑥",
  "⑦",
  "⑧",
  "⑨",
  "⑩",
  "⑪",
  "⑫",
  "⑬",
  "⑭",
  "⑮",
  "⑯",
  "⑰",
  "⑱",
];

export default function GreenCardPDFExport({
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
  const holeNumber = parseInt(hole);
  const edges = getBoundaryIntersectionY(
    holeData.boundary.d,
    currentPin?.y ?? 0,
  );
  const centerLineEdges = getBoundaryIntersectionX(holeData.boundary.d, 30);

  return (
    <Stage width={width} height={height} pixelRatio={4}>
      {/* 描画用Layer（スケーリングあり） */}
      <Layer scaleX={scale} scaleY={scale}>
        {/* 白背景 */}
        <Rect
          x={0}
          y={0}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          fill="#ffffff"
        />
        {/* バンカーとウォーターハザード */}
        {holeData.layers
          .filter((layer) => layer.type === "bunker" || layer.type === "water")
          .map((layer, index) => (
            <Path
              key={`layer-${index}`}
              data={scalePathToPixels(layer.d)}
              stroke="#000000"
              strokeWidth={4}
              fill="transparent"
            />
          ))}
        {/* 外周線 */}
        <Path
          data={scalePathToPixels(holeData.boundary.d)}
          stroke="#000000"
          strokeWidth={10}
          fill="transparent"
        />
        {/* 傾斜線 */}
        {holeData.slope ? (
          <Path
            data={scalePathToPixels(holeData.slope.slope.d)}
            stroke="#000000"
            strokeWidth={6}
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
              x={CANVAS_SIZE - 90}
              y={ydToPx(y) - 55}
              text={`${depth}`}
              fontSize={50}
              width={70}
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
            strokeWidth={2}
          />
        )}
        {/* 現在のピン */}
        {currentPin && (
          <Circle
            x={ydToPx(currentPin.x)}
            y={ydToPx(currentPin.y)}
            radius={12}
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
              strokeWidth={12}
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
                strokeWidth={12}
              />
            )}
          </Fragment>
        )}

        {/* 丸数字（左上） */}
        <Text
          x={30}
          y={30}
          text={CIRCLE_NUMBERS[holeNumber - 1] ?? ""}
          fontSize={160}
          fontStyle="bold"
          fill="#000000"
        />

        {/* 奥行き数字 */}
        {currentPin && (
          <Text
            text={`${Math.round(holeData.origin.y - currentPin.y)}`}
            fontSize={450}
            x={currentPin.x <= 30 ? ydToPx(45) : ydToPx(15)}
            y={ydToPx(currentPin.y)}
            offsetY={100}
            align="center"
            width={600}
            offsetX={300}
            fontStyle="bold"
            fill="#000000"
          />
        )}

        {/* 中心線上の表示「C」 */}
        {currentPin && currentPin.x === 30 && (
          <Text
            text="C"
            fontSize={200}
            x={ydToPx(currentPin.x) - 200}
            y={ydToPx(currentPin.y) - 200}
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
            const fontSize = 200;
            const textWidth = fontSize * text.length * 0.6;
            const margin = 10;

            let x: number;
            let y = ydToPx(currentPin.y);

            if (currentPin.x < 30) {
              x = ydToPx(edges.left) - margin - textWidth;
              if (x < 0) {
                x = margin;
                y = y - fontSize;
              }
            } else {
              x = ydToPx(edges.right) + margin;
              if (x + textWidth > CANVAS_SIZE) {
                x = CANVAS_SIZE - textWidth - margin;
                y = y - fontSize;
              }
            }

            return (
              <Text
                x={x}
                y={y}
                offsetY={100}
                text={text}
                fontSize={200}
                fontStyle="bold"
                fill="#000000"
              />
            );
          })()}
      </Layer>

      {/* 黒枠線用Layer（scaleなし） */}
      <Layer>
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          stroke="#000000"
          strokeWidth={2}
          fill="transparent"
        />
      </Layer>
    </Stage>
  );
}
