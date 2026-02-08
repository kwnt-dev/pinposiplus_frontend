import { Cell, Pin, HoleData } from "@/components/greens/GreenCanvas";
import {
  getOffsetBoundary,
  getOffsetSlope,
  isPointInPolygon,
} from "@/components/greens/GreenCanvas";

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

  // Step 3: フォールバック
  return [];
}
