import { Cell, Pin, HoleData } from "@/lib/greenCanvas.geometry";
import {
  getOffsetBoundary,
  getOffsetSlope,
  isPointInPolygon,
} from "@/lib/greenCanvas.geometry";

// 型定義

export interface AutoProposalInput {
  holeData: HoleData;
  exit: { x: number; y: number };
  damageCells: string[];
  banCells: string[];
  rainCells: string[];
  pastPins: Pin[];
  isRainyDay: boolean;
}

export interface Candidate {
  x: number;
  y: number;
}

//定数

const PAST_PIN_RESTRICTION_RADIUS = 7; // 過去ピン制限　半径yd
const BOUNDARY_BUFFER = 3.5; // 外周制限距離（ヤード）
const SLOPE_BUFFER = 3;

//メイン関数

export function generateProposals(input: AutoProposalInput): Candidate[] {
  // Step 1: 候補生成

  // グリッド交点を全部候補にする。
  const { holeData } = input;
  const insideCells = holeData.cells.filter((c) => c.isInside);

  const xSet = new Set<number>();
  const ySet = new Set<number>();
  insideCells.forEach((c) => {
    xSet.add(c.x);
    ySet.add(c.y);
  });

  const xValues = Array.from(xSet).sort((a, b) => a - b);
  const yValues = Array.from(ySet).sort((a, b) => a - b);

  const candidates: Candidate[] = [];
  for (const x of xValues) {
    for (const y of yValues) {
      candidates.push({ x, y });
    }
  }
  // Step 2: 除外フィルタ

  // 2-1 禁止セル
  const excludedBan = candidates.filter((c) => {
    const surroundingCells = [
      `cell_${Math.floor(c.x)}_${Math.floor(c.y)}`,
      `cell_${Math.floor(c.x) - 1}_${Math.floor(c.y)}`,
      `cell_${Math.floor(c.x)}_${Math.floor(c.y) - 1}`,
      `cell_${Math.floor(c.x) - 1}_${Math.floor(c.y) - 1}`,
    ];
    return !surroundingCells.some((id) => input.banCells.includes(id));
  });

  // 2-2 雨天禁止セル
  const excludedRain = input.isRainyDay
    ? excludedBan.filter((c) => {
        const surroundingCells = [
          `cell_${Math.floor(c.x)}_${Math.floor(c.y)}`,
          `cell_${Math.floor(c.x) - 1}_${Math.floor(c.y)}`,
          `cell_${Math.floor(c.x)}_${Math.floor(c.y) - 1}`,
          `cell_${Math.floor(c.x) - 1}_${Math.floor(c.y) - 1}`,
        ];
        return !surroundingCells.some((id) => input.rainCells.includes(id));
      })
    : excludedBan;

  // 2-3 傷みセル
  const excludedDamage = excludedRain.filter((c) => {
    const surroundingCells = [
      `cell_${Math.floor(c.x)}_${Math.floor(c.y)}`,
      `cell_${Math.floor(c.x) - 1}_${Math.floor(c.y)}`,
      `cell_${Math.floor(c.x)}_${Math.floor(c.y) - 1}`,
      `cell_${Math.floor(c.x) - 1}_${Math.floor(c.y) - 1}`,
    ];
    return !surroundingCells.some((id) => input.damageCells.includes(id));
  });

  // 2-4 傾斜制限
  const slopeBufferPoints = holeData.slope
    ? getOffsetSlope(holeData.slope.slope.d, SLOPE_BUFFER)
    : [];
  const excludedSlope =
    slopeBufferPoints.length > 0
      ? excludedDamage.filter(
          (c) => !isPointInPolygon(c.x, c.y, slopeBufferPoints),
        )
      : excludedDamage;

  // 2-5 外周制限
  const boundaryBufferPoints = getOffsetBoundary(
    holeData.boundary.d,
    BOUNDARY_BUFFER,
  );
  const excludedBoundary = excludedSlope.filter((c) =>
    isPointInPolygon(c.x, c.y, boundaryBufferPoints),
  );

  // 2-6 過去ピン
  const excludedPastPin = excludedBoundary.filter((c) => {
    for (let i = 0; i < input.pastPins.length; i++) {
      const past = input.pastPins[i];
      const dist = Math.sqrt(
        Math.pow(c.x - past.x, 2) + Math.pow(c.y - past.y, 2),
      );
      // 前回・前々回: 回避半径内は除外
      if (i <= 1 && dist < PAST_PIN_RESTRICTION_RADIUS) {
        return false;
      }
      // 3〜5回前: 同一座標のみ除外
      if (i >= 2 && i <= 4 && dist < 1) {
        return false;
      }
    }
    return true;
  });

  // 2-7 導線被り
  const excludedRoute = excludedPastPin.filter((c) => {
    if (input.pastPins.length === 0) return true;

    const candidateAngle =
      Math.atan2(input.exit.y - c.y, input.exit.x - c.x) * (180 / Math.PI);

    const recentPins = input.pastPins.slice(0, 2);
    for (const past of recentPins) {
      const pastAngle =
        Math.atan2(input.exit.y - past.y, input.exit.x - past.x) *
        (180 / Math.PI);
      let angleDiff = Math.abs(candidateAngle - pastAngle);
      if (angleDiff > 180) angleDiff = 360 - angleDiff;

      if (angleDiff < 10) return false;
    }
    return true;
  });

  // Step 3: フォールバック
  if (excludedRoute.length === 0) {
    // 過去ピン・導線の除外をスキップして返す
    return excludedBoundary.map((c) => ({ x: c.x, y: c.y }));
  }

  return excludedRoute.map((c) => ({ x: c.x, y: c.y }));
}
