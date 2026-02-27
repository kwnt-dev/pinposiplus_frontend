import { describe, test, expect } from "vitest";
import { calcBezierPoint, isInsideGreen } from "@/lib/greenCanvas.geometry";

describe("calcBezierPoint", () => {
  test("t=0で始点、t=1で終点を返す", () => {
    expect(calcBezierPoint(0, 0, 10, 20, 30)).toBe(0);
    expect(calcBezierPoint(1, 0, 10, 20, 30)).toBe(30);
  });

  test("t=0.5で中間値を返す", () => {
    const result = calcBezierPoint(0.5, 0, 0, 100, 100);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });
});

describe("isInsideGreen", () => {
  const cells = [
    { id: "cell_4_4", x: 4, y: 4, centerX: 4.5, centerY: 4.5, isInside: true },
    { id: "cell_5_4", x: 5, y: 4, centerX: 5.5, centerY: 4.5, isInside: true },
    { id: "cell_4_5", x: 4, y: 5, centerX: 4.5, centerY: 5.5, isInside: true },
    { id: "cell_5_5", x: 5, y: 5, centerX: 5.5, centerY: 5.5, isInside: true },
  ];

  test("四隅セルが全てisInsideならtrue", () => {
    const pin = { id: "pin1", x: 5, y: 5 };
    expect(isInsideGreen(pin, cells)).toBe(true);
  });

  test("四隅セルが存在しなければfalse", () => {
    const pin = { id: "pin2", x: 99, y: 99 };
    expect(isInsideGreen(pin, cells)).toBe(false);
  });
});
