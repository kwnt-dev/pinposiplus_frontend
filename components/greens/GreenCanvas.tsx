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
import Konva from "konva";
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
  onPinPlaced?: (currentPin: Pin) => void;
  pastPins?: Pin[];
  suggestedPins?: { x: number; y: number }[];
  // 表示制御
  showExit?: boolean;
  showGrid?: boolean;
  showYardLines?: boolean;
  showCenterLine?: boolean;
  showBoundaryLine?: boolean;
  showBoundaryBuffer?: boolean;
  showSlopeBuffer?: boolean;
  showExitRoute?: boolean;
  isRainyDay?: boolean;
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
  onPinPlaced,
  pastPins,
  suggestedPins = [],
  showExit = true,
  showGrid = true,
  showYardLines = true,
  showCenterLine = true,
  showBoundaryLine = true,
  showBoundaryBuffer = true,
  showSlopeBuffer = true,
  showExitRoute = true,
  isRainyDay = false,
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

  // タッチ・クリック共通ハンドラ
  const handleStageInteraction = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    // セルクリック処理
    if (onCellClick) {
      const x = Math.floor(pos.x / scale / YD_TO_PX);
      const y = Math.floor(pos.y / scale / YD_TO_PX);
      const cellId = `cell_${x}_${y}`;
      const cell = holeData.cells.find((c) => c.id === cellId);
      if (cell) {
        onCellClick(cellId);
      }
      return;
    }

    // ピン配置処理
    if (onPinPlaced && currentPin) {
      const snappedX = Math.round(pos.x / scale / YD_TO_PX);
      const snappedY = Math.round(pos.y / scale / YD_TO_PX);

      const surroundingCellIds = [
        `cell_${Math.floor(snappedX)}_${Math.floor(snappedY)}`,
        `cell_${Math.floor(snappedX) - 1}_${Math.floor(snappedY)}`,
        `cell_${Math.floor(snappedX)}_${Math.floor(snappedY) - 1}`,
        `cell_${Math.floor(snappedX) - 1}_${Math.floor(snappedY) - 1}`,
      ];

      const isOnBanCell = surroundingCellIds.some((id) =>
        banCells.includes(id),
      );
      const isOnDamageCell = surroundingCellIds.some((id) =>
        damageCells.includes(id),
      );
      const isOnRainCell =
        isRainyDay && surroundingCellIds.some((id) => rainCells.includes(id));

      if (
        isInsideGreen(
          { id: currentPin.id, x: snappedX, y: snappedY },
          holeData.cells,
        ) &&
        isPointInPolygon(snappedX, snappedY, boundaryBufferPoints) &&
        !isPointInPolygon(snappedX, snappedY, slopeBufferPoints) &&
        !isOnBanCell &&
        !isOnDamageCell &&
        !isOnRainCell
      ) {
        onPinPlaced({
          id: currentPin.id,
          x: snappedX,
          y: snappedY,
        });
      }
    }
  };

  return (
    <Stage width={width} height={height} scaleX={scale} scaleY={scale}>
      <Layer onClick={handleStageInteraction} onTap={handleStageInteraction}>
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

        {/* グリッド（グリーン面内にクリップ） */}
        {showGrid && (
          <Group
            clipFunc={() => {
              return [new Path2D(scalePathToPixels(holeData.boundary.d))];
            }}
          >
            {Array.from({ length: 61 }, (_, i) => (
              <Line
                key={`grid-v-${i}`}
                points={[ydToPx(i), 0, ydToPx(i), CANVAS_SIZE]}
                stroke="rgba(0,0,0,0.15)"
                strokeWidth={1}
              />
            ))}
            {Array.from({ length: 61 }, (_, i) => (
              <Line
                key={`grid-h-${i}`}
                points={[0, ydToPx(i), CANVAS_SIZE, ydToPx(i)]}
                stroke="rgba(0,0,0,0.15)"
                strokeWidth={1}
              />
            ))}
          </Group>
        )}

        {/* 外周線 */}
        {showBoundaryLine && (
          <Path
            data={scalePathToPixels(holeData.boundary.d)}
            stroke="#000000"
            strokeWidth={2}
            fill="transparent"
          />
        )}

        {/* 外周制限エリア */}
        {showBoundaryBuffer && (
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
        )}

        {/* 傾斜線 */}
        {showSlopeBuffer && holeData.slope ? (
          <Path
            data={scalePathToPixels(holeData.slope.slope.d)}
            stroke="#000000"
            strokeWidth={2}
            fill="transparent"
          />
        ) : null}

        {/* 傾斜制限エリア */}
        {showSlopeBuffer && holeData.slope ? (
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
        {showYardLines &&
          [0, 10, 20, 30, 40].map((depth) => {
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
        {showYardLines &&
          [0, 10, 20, 30, 40].map((depth) => {
            const y = holeData.origin.y - depth;
            return (
              <Text
                key={`label-${depth}`}
                x={CANVAS_SIZE - 75}
                y={ydToPx(y) - 45}
                text={`${depth}`}
                fontSize={45}
                width={65}
                align="right"
                fontStyle="bold"
                fill="#000000"
              />
            );
          })}

        {/* 中心線（黄色破線） */}
        {showCenterLine && (
          <>
            <Line
              points={[
                ydToPx(config.centerLineMarks.front.x),
                ydToPx(config.centerLineMarks.front.y),
                ydToPx(config.centerLineMarks.back.x),
                ydToPx(config.centerLineMarks.back.y),
              ]}
              stroke="#fbbf24"
              strokeWidth={2}
              dash={[10, 5]}
            />
            {/* 中心線マーク（前） */}
            <Circle
              x={ydToPx(config.centerLineMarks.front.x)}
              y={ydToPx(config.centerLineMarks.front.y)}
              radius={10}
              fill="white"
              stroke="#000000"
              strokeWidth={1.5}
            />
            <Circle
              x={ydToPx(config.centerLineMarks.front.x)}
              y={ydToPx(config.centerLineMarks.front.y)}
              radius={7}
              fill="#fbbf24"
            />
            {/* 中心線マーク（後） */}
            <Circle
              x={ydToPx(config.centerLineMarks.back.x)}
              y={ydToPx(config.centerLineMarks.back.y)}
              radius={10}
              fill="white"
              stroke="#000000"
              strokeWidth={1.5}
            />
            <Circle
              x={ydToPx(config.centerLineMarks.back.x)}
              y={ydToPx(config.centerLineMarks.back.y)}
              radius={7}
              fill="#fbbf24"
            />
          </>
        )}

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
                fill="rgba(239, 68, 68, 0.9)"
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
                fill="rgba(75, 85, 99, 0.9)"
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
                fill="rgba(59, 130, 246, 0.9)"
              />
            );
          })}
        </Group>

        {/* 過去ピン */}
        {pastPins &&
          pastPins.map((pin, index) => {
            const dateLabel = pin.date
              ? `${new Date(pin.date).getMonth() + 1}/${new Date(pin.date).getDate()}`
              : null;
            return (
              <Fragment key={`pastPin-${pin.id}`}>
                {/* 制限円（前回・前々回のみ） */}
                {index <= 1 && (
                  <Circle
                    x={ydToPx(pin.x)}
                    y={ydToPx(pin.y)}
                    radius={PAST_PIN_RESTRICTION_RADIUS * YD_TO_PX}
                    fill={index === 0 ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.08)"}
                  />
                )}
                {/* 過去ピン（新しい順に濃→薄） */}
                <Circle
                  x={ydToPx(pin.x)}
                  y={ydToPx(pin.y)}
                  radius={8}
                  fill={
                    index === 0
                      ? "#374151"
                      : index === 1
                        ? "#6b7280"
                        : "#9ca3af"
                  }
                />
                {/* 日付ラベル（前回・前々回のみ） */}
                {index <= 1 && dateLabel && (
                  <>
                    <Rect
                      x={ydToPx(pin.x) - 35}
                      y={ydToPx(pin.y) - 32}
                      width={70}
                      height={22}
                      fill="white"
                      stroke={index === 0 ? "#374151" : "#9ca3af"}
                      strokeWidth={1.5}
                    />
                    <Text
                      x={ydToPx(pin.x) - 35}
                      y={ydToPx(pin.y) - 30}
                      width={70}
                      align="center"
                      text={dateLabel}
                      fontSize={16}
                      fontStyle="bold"
                      fill={index === 0 ? "#374151" : "#9ca3af"}
                    />
                  </>
                )}
              </Fragment>
            );
          })}

        {/* 過去ピン出口線（前回・前々回のみ） */}
        {showExitRoute &&
          pastPins &&
          pastPins
            .slice(0, 2)
            .map((pin) => (
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

        {/* 現在のピン（白丸+赤丸の二重丸） */}
        {currentPin && (
          <Group x={ydToPx(currentPin.x)} y={ydToPx(currentPin.y)}>
            <Circle radius={12} fill="white" />
            <Circle radius={9} fill="#ef4444" />
          </Group>
        )}

        {/* 現在ピン出口線 */}
        {showExitRoute && currentPin && (
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

        {/* EXIT（最前面） */}
        {showExit && (
          <>
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
          </>
        )}
      </Layer>
    </Stage>
  );
}
