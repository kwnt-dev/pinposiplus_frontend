import { Candidate } from "./autoProposal";

// 型定義

export type CourseDifficulty = "easy" | "medium" | "hard";

export interface HoleCandidates {
  holeNumber: number;
  candidates: Candidate[];
  isShortHole: boolean;
  cells: { x: number; y: number; isInside: boolean }[];
}

export interface CourseProposalInput {
  holes: HoleCandidates[];
  courseDifficulty: CourseDifficulty;
}

export interface CourseProposalResult {
  holes: {
    holeNumber: number;
    selectedPin: Candidate;
  }[];
}

type DepthPosition = "front" | "middle" | "back";
type HorizontalPosition = "left" | "center" | "right";

//定数
const DEPTH_DISTRIBUTION: Record<
  CourseDifficulty,
  { back: number; middle: number; front: number }
> = {
  hard: { back: 4, middle: 3, front: 2 },
  medium: { back: 3, middle: 3, front: 3 },
  easy: { back: 2, middle: 3, front: 4 },
};

//判定関数

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

//メイン関数

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

    // ルール1〜5 をここに書いていく

    // ルール1: ショートホール段分散
    if (hole.isShortHole) {
      const filtered = pool.filter(
        (c) =>
          !usedShortHoleDepths.includes(getDepthPosition(c.y, hole.candidates)),
      );
      if (filtered.length > 0) pool = filtered;
    }
  }

  return { holes: [] };
}
