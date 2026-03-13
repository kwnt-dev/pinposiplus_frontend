import { Candidate } from "./autoProposal";
import { HOLE_CONFIGS } from "@/config/holes";

/** コース難易度 */
export type CourseDifficulty = "easy" | "medium" | "hard";

/** ホールごとのピン候補データ */
export interface HoleCandidates {
  holeNumber: number;
  candidates: Candidate[];
  isShortHole: boolean;
  cells: { x: number; y: number; isInside: boolean }[];
}

/** コース提案の入力データ */
export interface CourseProposalInput {
  holes: HoleCandidates[];
  courseDifficulty: CourseDifficulty;
}

/** コース提案の結果 */
export interface CourseProposalResult {
  holes: {
    holeNumber: number;
    selectedPin: Candidate;
  }[];
}

/** 奥行き位置（奥・中央・手前） */
type DepthPosition = "front" | "middle" | "back";
/** 左右位置 */
type HorizontalPosition = "left" | "center" | "right";

/** グリーン中央X座標（ヤード） */
const GREEN_CENTER_X = 30;

/** 難易度ごとの奥行き配分（9ホール中の目標数） */
const DEPTH_DISTRIBUTION: Record<
  CourseDifficulty,
  { back: number; middle: number; front: number }
> = {
  hard: { back: 4, middle: 3, front: 2 },
  medium: { back: 3, middle: 3, front: 3 },
  easy: { back: 2, middle: 3, front: 4 },
};

/**
 * 候補の奥行き位置を判定
 * グリーン内セルのY座標範囲を3等分して分類
 * Y値が小さい = 奥（back）、Y値が大きい = 手前（front）
 */
function getDepthPosition(
  y: number,
  cells: { y: number; isInside: boolean }[],
): DepthPosition {
  const insideCells = cells.filter((c) => c.isInside);
  const yValues = insideCells.map((c) => c.y);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const range = maxY - minY;

  // 3等分の境界
  const oneThird = minY + range / 3;
  const twoThird = minY + (range * 2) / 3;

  if (y < oneThird) return "back";
  if (y < twoThird) return "middle";
  return "front";
}

/**
 * 候補の左右位置を判定
 * グリーン内セルのX座標範囲を3等分して分類
 */
function getHorizontalPosition(
  x: number,
  cells: { x: number; isInside: boolean }[],
): HorizontalPosition {
  const insideCells = cells.filter((c) => c.isInside);
  const xValues = insideCells.map((c) => c.x);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const range = maxX - minX;

  const oneThird = minX + range / 3;
  const twoThird = minX + (range * 2) / 3;

  if (x < oneThird) return "left";
  if (x < twoThird) return "center";
  return "right";
}

/**
 * 9ホール分のピン位置をコース全体のバランスで選定する
 * ルール1: ショートホールの奥行き分散
 * ルール2: 前ホールとの位置変化（奥行き・左右が異なる候補を優先）
 * ルール3: 難易度に応じた奥行き配分の目標枠が空いてる位置を優先
 * ルール4: グリーン中央に近い候補を選択
 */
export function generateCourseProposal(
  input: CourseProposalInput,
): CourseProposalResult {
  const target = DEPTH_DISTRIBUTION[input.courseDifficulty];
  const currentDepth = { back: 0, middle: 0, front: 0 };
  const usedShortHoleDepths: DepthPosition[] = [];
  const result: CourseProposalResult["holes"] = [];

  for (const hole of input.holes) {
    let pool = [...hole.candidates];
    if (pool.length === 0) continue;

    // ルール1: ショートホール段分散
    if (hole.isShortHole) {
      const filtered = pool.filter(
        (c) => !usedShortHoleDepths.includes(getDepthPosition(c.y, hole.cells)),
      );
      if (filtered.length > 0) pool = filtered;
    }

    // ルール2: 前ホールとの位置変化（奥行き違い+1、左右違い+1でスコア付け）
    if (result.length > 0) {
      const prevPin = result[result.length - 1].selectedPin;
      const prevCells = input.holes[result.length - 1].cells;
      const prevDepth = getDepthPosition(prevPin.y, prevCells);
      const prevHorizontal = getHorizontalPosition(prevPin.x, prevCells);

      const scored = pool.map((c) => {
        let score = 0;
        if (getDepthPosition(c.y, hole.cells) !== prevDepth) score++;
        if (getHorizontalPosition(c.x, hole.cells) !== prevHorizontal) score++;
        return { candidate: c, score };
      });

      const maxScore = Math.max(...scored.map((s) => s.score));
      const filtered = scored
        .filter((s) => s.score === maxScore)
        .map((s) => s.candidate);

      if (filtered.length > 0) pool = filtered;
    }

    // ルール3: 枠が空いてる位置を優先
    // 例: 目標が{ back:3, middle:3, front:3 }でここまでが{ back:2, middle:3, front:1 }なら
    // backとfrontが空き枠 → その位置の候補を優先
    const openDepths = (Object.keys(target) as DepthPosition[]).filter(
      (d) => currentDepth[d] < target[d],
    );
    if (openDepths.length > 0) {
      const filtered = pool.filter((c) =>
        openDepths.includes(getDepthPosition(c.y, hole.cells)),
      );
      if (filtered.length > 0) pool = filtered;
    }

    // ルール4: グリーン中央に近い候補を選択
    const holeConfig = HOLE_CONFIGS[String(hole.holeNumber).padStart(2, "0")];
    const centerX = GREEN_CENTER_X;
    const centerY =
      (holeConfig.centerLineMarks.front.y + holeConfig.centerLineMarks.back.y) /
      2;

    pool.sort((a, b) => {
      const distA = Math.pow(a.x - centerX, 2) + Math.pow(a.y - centerY, 2);
      const distB = Math.pow(b.x - centerX, 2) + Math.pow(b.y - centerY, 2);
      return distA - distB;
    });

    const selected = pool[0];

    // カウント更新
    const selectedDepth = getDepthPosition(selected.y, hole.cells);
    currentDepth[selectedDepth]++;

    if (hole.isShortHole) {
      usedShortHoleDepths.push(selectedDepth);
    }

    result.push({
      holeNumber: hole.holeNumber,
      selectedPin: selected,
    });
  }

  return { holes: result };
}
