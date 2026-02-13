import ClipperLib from "clipper-lib";

// 定数
const YD_TO_PX = 20;
const CANVAS_SIZE = 60 * YD_TO_PX;
const PAST_PIN_RESTRICTION_RADIUS = 7; // 過去ピン制限　半径yd
const BOUNDARY_BUFFER = 3.5; // 外周制限距離（ヤード）
const SLOPE_BUFFER = 3;

// ユーティリティ関数
function scalePathToPixels(d: string): string {
  return d.replace(/-?\d+\.?\d*(e[-+]?\d+)?/gi, (match) =>
    Math.round(parseFloat(match) * YD_TO_PX).toString(),
  );
}

function ydToPx(yd: number): number {
  return yd * YD_TO_PX;
}

/**
 * グリーン内外判定
 * JSONのisInsideを使用（svg→jsonで内側のセルのみ生成）
 * エッジケース：外周線と重なるセルは四隅判定で対応
 */
function isInsideGreen(pin: Pin, cells: Cell[]): boolean {
  // ピン位置の四隅のセルをチェック
  const surroundingCells = [
    { x: Math.floor(pin.x) - 1, y: Math.floor(pin.y) - 1 },
    { x: Math.floor(pin.x), y: Math.floor(pin.y) - 1 },
    { x: Math.floor(pin.x) - 1, y: Math.floor(pin.y) },
    { x: Math.floor(pin.x), y: Math.floor(pin.y) },
  ];

  const allInside = surroundingCells.every((c) => {
    const cell = cells.find((cell) => cell.x === c.x && cell.y === c.y);
    return cell && cell.isInside;
  });

  return allInside;
}

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
