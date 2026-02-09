import { Cell, Pin, HoleData } from "@/components/greens/GreenCanvas";
import ClipperLib from "clipper-lib";

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

//ユーティリティ関数

// SVGベジェ曲線上の1点の座標を計算する関数
export function calcBezierPoint(
  t: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number,
): number {
  const mt = 1 - t;
  return (
    mt * mt * mt * p0 +
    3 * mt * mt * t * p1 +
    3 * mt * t * t * p2 +
    t * t * t * p3
  );
}

// SVGパス文字列を点配列に変換する（ベジェ曲線は直線近似）関数
export function svgPathToPoints(
  d: string,
  segments = 40,
): { x: number; y: number }[] {
  // パスをコマンドと数字に分解
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+/g);
  if (!tokens) return [];

  const pts: { x: number; y: number }[] = [];
  let cx = 0;
  let cy = 0;
  let startX = 0;
  let startY = 0;
  let cmd: string | null = null;
  let i = 0;

  const isLetter = (tok: string) => /^[a-zA-Z]$/.test(tok);

  while (i < tokens.length) {
    const tok = tokens[i];

    if (isLetter(tok)) {
      cmd = tok;
      i++;
    }

    if (!cmd) break;

    // M: 開始点
    if (cmd === "m" || cmd === "M") {
      if (i + 1 >= tokens.length) break;
      const x = parseFloat(tokens[i++]);
      const y = parseFloat(tokens[i++]);
      if (cmd === "m") {
        cx += x;
        cy += y;
      } else {
        cx = x;
        cy = y;
      }
      startX = cx;
      startY = cy;
      pts.push({ x: cx, y: cy });

      // C: ベジェ曲線（segments個の点に分割）
    } else if (cmd === "c" || cmd === "C") {
      while (i + 5 < tokens.length && !isLetter(tokens[i])) {
        const dx1 = parseFloat(tokens[i++]);
        const dy1 = parseFloat(tokens[i++]);
        const dx2 = parseFloat(tokens[i++]);
        const dy2 = parseFloat(tokens[i++]);
        const dx = parseFloat(tokens[i++]);
        const dy = parseFloat(tokens[i++]);

        let c1x: number,
          c1y: number,
          c2x: number,
          c2y: number,
          ex: number,
          ey: number;

        if (cmd === "c") {
          c1x = cx + dx1;
          c1y = cy + dy1;
          c2x = cx + dx2;
          c2y = cy + dy2;
          ex = cx + dx;
          ey = cy + dy;
        } else {
          c1x = dx1;
          c1y = dy1;
          c2x = dx2;
          c2y = dy2;
          ex = dx;
          ey = dy;
        }

        for (let k = 0; k <= segments; k++) {
          const t = k / segments;
          const x = calcBezierPoint(t, cx, c1x, c2x, ex);
          const y = calcBezierPoint(t, cy, c1y, c2y, ey);
          pts.push({ x, y });
        }

        cx = ex;
        cy = ey;
      }

      // z: パスを閉じる
    } else if (cmd === "z" || cmd === "Z") {
      pts.push({ x: startX, y: startY });
      i++;
    } else {
      break;
    }
  }

  return pts;
}

// 境界線から内側にオフセットした境界を生成する関数
export function getOffsetBoundary(
  boundaryD: string,
  offsetYd: number,
): { x: number; y: number }[] {
  const polygon = svgPathToPoints(boundaryD, 80);
  if (polygon.length < 3) return [];

  const SCALE = 1000;
  const clipperPath: ClipperLib.IntPoint[] = polygon.map((p) => ({
    X: Math.round(p.x * SCALE),
    Y: Math.round(p.y * SCALE),
  }));

  const co = new ClipperLib.ClipperOffset();
  co.AddPath(
    clipperPath,
    ClipperLib.JoinType.jtRound,
    ClipperLib.EndType.etClosedPolygon,
  );

  const solution: ClipperLib.IntPoint[][] = [];
  co.Execute(solution, -offsetYd * SCALE);

  if (solution.length === 0 || solution[0].length === 0) return [];

  return solution[0].map((p) => ({
    x: p.X / SCALE,
    y: p.Y / SCALE,
  }));
}

// 傾斜線から両側にオフセットした境界を生成する関数
export function getOffsetSlope(
  slopeD: string,
  offsetYd: number,
): { x: number; y: number }[] {
  const polygon = svgPathToPoints(slopeD, 80);
  if (polygon.length < 3) return [];

  const SCALE = 1000;
  const clipperPath: ClipperLib.IntPoint[] = polygon.map((p) => ({
    X: Math.round(p.x * SCALE),
    Y: Math.round(p.y * SCALE),
  }));

  const co = new ClipperLib.ClipperOffset();
  co.AddPath(
    clipperPath,
    ClipperLib.JoinType.jtRound,
    ClipperLib.EndType.etOpenRound,
  );

  const solution: ClipperLib.IntPoint[][] = [];
  co.Execute(solution, offsetYd * SCALE);

  if (solution.length === 0 || solution[0].length === 0) return [];

  return solution[0].map((p) => ({
    x: p.X / SCALE,
    y: p.Y / SCALE,
  }));
}

// ポリゴン内にピンがあるか判定する関数
export function isPointInPolygon(
  x: number,
  y: number,
  polygon: { x: number; y: number }[],
): boolean {
  if (polygon.length < 3) return false;

  const SCALE = 1000;
  const point: ClipperLib.IntPoint = {
    X: Math.round(x * SCALE),
    Y: Math.round(y * SCALE),
  };

  const clipperPath: ClipperLib.IntPoint[] = polygon.map((p) => ({
    X: Math.round(p.x * SCALE),
    Y: Math.round(p.y * SCALE),
  }));

  const result = ClipperLib.Clipper.PointInPolygon(point, clipperPath);
  return result !== 0;
}

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
