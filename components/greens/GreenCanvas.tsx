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
import { HOLE_CONFIGS } from "@/config/holes";
import {
  Pin,
  HoleData,
  getOffsetBoundary,
  getOffsetSlope,
  isPointInPolygon,
  isInsideGreen,
} from "@/lib/greenCanvas.geometry";
import {
  CANVAS_SIZE,
  YD_TO_PX,
  scalePathToPixels,
  ydToPx,
} from "@/lib/greenCanvas.convert";

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
const PAST_PIN_RESTRICTION_RADIUS = 7; // 過去ピン制限　半径yd
const BOUNDARY_BUFFER = 3.5; // 外周制限距離（ヤード）
const SLOPE_BUFFER = 3;

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
        <Rect
          x={ydToPx(config.exit.x) - 45}
          y={ydToPx(config.exit.y) - 18}
          width={90}
          height={36}
          fill="white"
          stroke="#f97316"
          strokeWidth={3}
        />
        <Text
          x={ydToPx(config.exit.x) - 45}
          y={ydToPx(config.exit.y) - 12}
          width={90}
          align="center"
          text="EXIT"
          fontSize={24}
          fontStyle="bold"
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
