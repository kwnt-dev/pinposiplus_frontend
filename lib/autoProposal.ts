import { Cell, Pin, HoleData } from "@/lib/greenCanvas.geometry";
import {
  getOffsetBoundary,
  getOffsetSlope,
  isPointInPolygon,
} from "@/lib/greenCanvas.geometry";
import {
  PAST_PIN_RESTRICTION_RADIUS,
  BOUNDARY_BUFFER,
  SLOPE_BUFFER,
} from "@/config/constants";

/** 自動提案の入力データ */
export interface AutoProposalInput {
  holeData: HoleData;
  exit: { x: number; y: number };
  damageCells: string[];
  banCells: string[];
  rainCells: string[];
  pastPins: Pin[];
  isRainyDay: boolean;
}

/** ピン候補の座標 */
export interface Candidate {
  x: number;
  y: number;
}

/** 自動提案ロジックの定数 */
const SAME_POSITION_THRESHOLD = 1; // 同一座標とみなす距離（ヤード）
const ROUTE_OVERLAP_ANGLE = 10; // 導線被り判定角度（度）
const RECENT_PIN_COUNT = 2; // 直近ピン制限の対象数（前回・前々回）
const MEDIUM_PAST_START = 2; // 中期ピンの開始インデックス（3回前）
const MEDIUM_PAST_END = 4; // 中期ピンの終了インデックス（5回前）

/**
 * 1ホール分のピン候補を生成する
 * Step1: グリッド交点から全候補を生成
 * Step2: 各種制約で除外フィルタ（禁止→雨天→傷み→傾斜→外周→過去ピン→導線）
 * Step3: 候補が0件ならフォールバック（過去ピン・導線の除外をスキップ）
 */
export function generateProposals(input: AutoProposalInput): Candidate[] {
  // Step 1: 候補生成

  // グリッド交点を全部候補にする
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

  // 2-1 禁止セル（候補の周囲4セルに禁止セルがあれば除外）
  const excludedBan = candidates.filter((c) => {
    const surroundingCells = [
      `cell_${Math.floor(c.x)}_${Math.floor(c.y)}`,
      `cell_${Math.floor(c.x) - 1}_${Math.floor(c.y)}`,
      `cell_${Math.floor(c.x)}_${Math.floor(c.y) - 1}`,
      `cell_${Math.floor(c.x) - 1}_${Math.floor(c.y) - 1}`,
    ];
    return !surroundingCells.some((id) => input.banCells.includes(id));
  });

  // 2-2 雨天禁止セル（雨天時のみ適用）
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

  // 2-4 傾斜制限（傾斜線の両側バッファ内を除外）
  const slopeBufferPoints = holeData.slope
    ? getOffsetSlope(holeData.slope.slope.d, SLOPE_BUFFER)
    : [];
  const excludedSlope =
    slopeBufferPoints.length > 0
      ? excludedDamage.filter(
          (c) => !isPointInPolygon(c.x, c.y, slopeBufferPoints),
        )
      : excludedDamage;

  // 2-5 外周制限（外周からバッファ距離以上内側のみ残す）
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
      if (i < RECENT_PIN_COUNT && dist < PAST_PIN_RESTRICTION_RADIUS) {
        return false;
      }
      // 3〜5回前: 同一座標のみ除外
      if (
        i >= MEDIUM_PAST_START &&
        i <= MEDIUM_PAST_END &&
        dist < SAME_POSITION_THRESHOLD
      ) {
        return false;
      }
    }
    return true;
  });

  // 2-7 導線被り（出口への角度が直近ピンと近すぎる候補を除外）
  const excludedRoute = excludedPastPin.filter((c) => {
    if (input.pastPins.length === 0) return true;

    const candidateAngle =
      Math.atan2(input.exit.y - c.y, input.exit.x - c.x) * (180 / Math.PI);

    const recentPins = input.pastPins.slice(0, RECENT_PIN_COUNT);
    for (const past of recentPins) {
      const pastAngle =
        Math.atan2(input.exit.y - past.y, input.exit.x - past.x) *
        (180 / Math.PI);
      let angleDiff = Math.abs(candidateAngle - pastAngle);
      if (angleDiff > 180) angleDiff = 360 - angleDiff;

      if (angleDiff < ROUTE_OVERLAP_ANGLE) return false;
    }
    return true;
  });

  // Step 3: フォールバック（候補が0件なら過去ピン・導線の除外をスキップ）
  if (excludedRoute.length === 0) {
    return excludedBoundary.map((c) => ({ x: c.x, y: c.y }));
  }

  return excludedRoute.map((c) => ({ x: c.x, y: c.y }));
}
