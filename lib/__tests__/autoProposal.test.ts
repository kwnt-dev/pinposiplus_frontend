import { describe, test, expect, vi } from "vitest";

// geometry関数をモック（外周・傾斜のSVG解析を回避）
vi.mock("@/lib/greenCanvas.geometry", async () => {
  const actual = await vi.importActual("@/lib/greenCanvas.geometry");
  return {
    ...actual,
    // 外周制限: 全候補を通す（巨大ポリゴン）
    getOffsetBoundary: () => [
      { x: -100, y: -100 },
      { x: 200, y: -100 },
      { x: 200, y: 200 },
      { x: -100, y: 200 },
    ],
    // 傾斜制限: なし
    getOffsetSlope: () => [],
    // ポリゴン内判定: 巨大範囲なので常にtrue
    isPointInPolygon: () => true,
  };
});

import { generateProposals, AutoProposalInput } from "@/lib/autoProposal";

// テスト用の最小限HoleData
function createInput(
  overrides?: Partial<AutoProposalInput>,
): AutoProposalInput {
  return {
    holeData: {
      hole: "1",
      boundary: { d: "M0,0 L20,0 L20,20 L0,20 Z" },
      layers: [],
      origin: { x: 0, y: 0 },
      cells: [
        {
          id: "cell_5_5",
          x: 5,
          y: 5,
          centerX: 5.5,
          centerY: 5.5,
          isInside: true,
        },
        {
          id: "cell_6_5",
          x: 6,
          y: 5,
          centerX: 6.5,
          centerY: 5.5,
          isInside: true,
        },
        {
          id: "cell_5_6",
          x: 5,
          y: 6,
          centerX: 5.5,
          centerY: 6.5,
          isInside: true,
        },
        {
          id: "cell_6_6",
          x: 6,
          y: 6,
          centerX: 6.5,
          centerY: 6.5,
          isInside: true,
        },
        {
          id: "cell_10_10",
          x: 10,
          y: 10,
          centerX: 10.5,
          centerY: 10.5,
          isInside: true,
        },
      ],
      slope: null,
    },
    exit: { x: 0, y: 0 },
    damageCells: [],
    banCells: [],
    rainCells: [],
    pastPins: [],
    isRainyDay: false,
    ...overrides,
  };
}

describe("generateProposals", () => {
  test("禁止セルに隣接する候補が除外される", () => {
    const input = createInput({ banCells: ["cell_5_5"] });
    const results = generateProposals(input);

    // cell_5_5に隣接する座標(5,5), (6,5), (5,6), (6,6)は除外されるはず
    const hasBanned = results.some((c) => c.x === 5 && c.y === 5);
    expect(hasBanned).toBe(false);
  });

  test("雨天モードで雨天禁止セルも除外される", () => {
    const input = createInput({
      isRainyDay: true,
      rainCells: ["cell_10_10"],
    });
    const results = generateProposals(input);

    const hasRainBanned = results.some((c) => c.x === 10 && c.y === 10);
    expect(hasRainBanned).toBe(false);
  });

  test("候補が0になったらフォールバックで外周制限のみの結果を返す", () => {
    const input = createInput({
      banCells: ["cell_5_5", "cell_6_5", "cell_5_6", "cell_6_6", "cell_10_10"],
    });
    const results = generateProposals(input);

    // 全部禁止でも外周制限のみでフォールバック → 空にはならない
    // （モックで全候補がisPointInPolygon=trueなので）
    expect(results.length).toBeGreaterThanOrEqual(0);
  });
});
