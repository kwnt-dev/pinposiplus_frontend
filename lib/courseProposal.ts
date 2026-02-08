import { Candidate } from "./autoProposal";

// 型定義

export type CourseDifficulty = "easy" | "medium" | "hard";

export interface HoleCandidates {
  holeNumber: number;
  candidates: Candidate[];
  isShortHole: boolean;
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

//メイン関数

export function generateCourseProposal(
  input: CourseProposalInput,
): CourseProposalResult {
  // Step A: 奥行き分布
  const DEPTH_DISTRIBUTION: Record<
    CourseDifficulty,
    { back: number; middle: number; front: number }
  > = {
    hard: { back: 4, middle: 3, front: 2 },
    medium: { back: 3, middle: 3, front: 3 },
    easy: { back: 2, middle: 3, front: 4 },
  };

  type DepthPosition = "front" | "middle" | "back";

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
  // Step B: 各ホール順にバランス選択
  return { holes: [] };
}
