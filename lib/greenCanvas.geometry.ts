import ClipperLib from "clipper-lib";

// 型定義

export interface Cell {
  id: string;
  x: number;
  y: number;
  centerX: number;
  centerY: number;
  isInside: boolean;
}

export interface Pin {
  id: string;
  x: number;
  y: number;
}

export interface HolePin {
  hole: number;
  x: number;
  y: number;
}

export interface LayerData {
  type: string;
  d: string;
  fill: string;
}

export interface HoleData {
  hole: string;
  boundary: { d: string };
  layers: LayerData[];
  origin: { x: number; y: number };
  cells: Cell[];
  slope: {
    upper: { d: string };
    lower: { d: string };
    slope: { d: string };
  } | null;
}

// 幾何学計算関数

/** SVGベジェ曲線上の1点の座標を計算する */
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

/** SVGパス文字列を点配列に変換する（ベジェ曲線は直線近似） */
export function svgPathToPoints(
  d: string,
  segments = 40,
): { x: number; y: number }[] {
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
    } else if (cmd === "z" || cmd === "Z") {
      pts.push({ x: startX, y: startY });
      i++;
    } else {
      break;
    }
  }

  return pts;
}

/** 境界線から内側にオフセットした境界を生成する */
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

/** 傾斜線から両側にオフセットした境界を生成する */
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

/** ポリゴン内に点があるか判定する */
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

/**
 * グリーン内外判定
 * ピン位置の四隅のセルが全てisInsideならグリーン内
 */
export function isInsideGreen(pin: Pin, cells: Cell[]): boolean {
  const surroundingCells = [
    { x: Math.floor(pin.x) - 1, y: Math.floor(pin.y) - 1 },
    { x: Math.floor(pin.x), y: Math.floor(pin.y) - 1 },
    { x: Math.floor(pin.x) - 1, y: Math.floor(pin.y) },
    { x: Math.floor(pin.x), y: Math.floor(pin.y) },
  ];

  return surroundingCells.every((c) => {
    const cell = cells.find((cell) => cell.x === c.x && cell.y === c.y);
    return cell && cell.isInside;
  });
}

/** 境界線とX座標の交点Y座標を取得する */
export function getBoundaryIntersectionX(
  d: string,
  pinX: number,
): { top: number; bottom: number } | null {
  const polygon = svgPathToPoints(d, 80);
  if (polygon.length < 3) return null;

  const intersections: number[] = [];

  for (let i = 0; i < polygon.length - 1; i++) {
    const p1 = polygon[i];
    const p2 = polygon[i + 1];

    if ((p1.x <= pinX && p2.x >= pinX) || (p1.x >= pinX && p2.x <= pinX)) {
      if (Math.abs(p2.x - p1.x) < 0.001) {
        intersections.push(p1.y, p2.y);
      } else {
        const t = (pinX - p1.x) / (p2.x - p1.x);
        const y = p1.y + t * (p2.y - p1.y);
        intersections.push(y);
      }
    }
  }

  if (intersections.length < 2) return null;

  const top = Math.min(...intersections);
  const bottom = Math.max(...intersections);

  return { top, bottom };
}

/** 境界線とY座標の交点X座標を取得する */
export function getBoundaryIntersectionY(
  d: string,
  pinY: number,
): { left: number; right: number } | null {
  const polygon = svgPathToPoints(d, 80);
  if (polygon.length < 3) return null;

  const intersections: number[] = [];

  for (let i = 0; i < polygon.length - 1; i++) {
    const p1 = polygon[i];
    const p2 = polygon[i + 1];

    if ((p1.y <= pinY && p2.y >= pinY) || (p1.y >= pinY && p2.y <= pinY)) {
      if (Math.abs(p2.y - p1.y) < 0.001) {
        intersections.push(p1.x, p2.x);
      } else {
        const t = (pinY - p1.y) / (p2.y - p1.y);
        const x = p1.x + t * (p2.x - p1.x);
        intersections.push(x);
      }
    }
  }

  if (intersections.length < 2) return null;

  const left = Math.min(...intersections);
  const right = Math.max(...intersections);

  return { left, right };
}
