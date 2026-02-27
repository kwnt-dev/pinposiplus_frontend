import { describe, test, expect } from "vitest";
import {
  generateCourseProposal,
  CourseProposalInput,
} from "@/lib/courseProposal";

// テスト用のホールデータを生成
function createHole(
  holeNumber: number,
  candidates: { x: number; y: number }[],
  isShortHole = false,
) {
  // Y: 10〜60の範囲でセルを作る（奥行き3等分判定用）
  const cells = [];
  for (let x = 20; x <= 40; x += 2) {
    for (let y = 10; y <= 60; y += 2) {
      cells.push({ x, y, isInside: true });
    }
  }
  return { holeNumber, candidates, isShortHole, cells };
}

describe("generateCourseProposal", () => {
  test("全ホールにピンが選択される", () => {
    const input: CourseProposalInput = {
      holes: [
        createHole(1, [
          { x: 30, y: 20 },
          { x: 30, y: 40 },
        ]),
        createHole(2, [
          { x: 30, y: 30 },
          { x: 30, y: 50 },
        ]),
        createHole(3, [
          { x: 30, y: 15 },
          { x: 30, y: 45 },
        ]),
      ],
      courseDifficulty: "medium",
    };
    const result = generateCourseProposal(input);

    expect(result.holes).toHaveLength(3);
    result.holes.forEach((h) => {
      expect(h.selectedPin).toBeDefined();
      expect(h.selectedPin.x).toBeGreaterThan(0);
      expect(h.selectedPin.y).toBeGreaterThan(0);
    });
  });

  test("hard難易度ではback配置が多くなる", () => {
    // back(y<26), middle(26-43), front(43<)
    const candidates = [
      { x: 30, y: 15 }, // back
      { x: 30, y: 35 }, // middle
      { x: 30, y: 55 }, // front
    ];
    const input: CourseProposalInput = {
      holes: Array.from({ length: 9 }, (_, i) =>
        createHole(i + 1, [...candidates]),
      ),
      courseDifficulty: "hard",
    };
    const result = generateCourseProposal(input);

    let backCount = 0;
    for (const h of result.holes) {
      if (h.selectedPin.y < 27) backCount++;
    }
    // hard: back目標4 → backが多いはず
    expect(backCount).toBeGreaterThanOrEqual(3);
  });

  test("候補が空のホールはスキップされる", () => {
    const input: CourseProposalInput = {
      holes: [
        createHole(1, [{ x: 30, y: 30 }]),
        createHole(2, []), // 候補なし
        createHole(3, [{ x: 30, y: 40 }]),
      ],
      courseDifficulty: "medium",
    };
    const result = generateCourseProposal(input);

    expect(result.holes).toHaveLength(2);
    expect(result.holes[0].holeNumber).toBe(1);
    expect(result.holes[1].holeNumber).toBe(3);
  });
});
