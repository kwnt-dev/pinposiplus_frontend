/**
 * SVG → JSON 統合変換スクリプト
 * 
 * 機能:
 * - 全レイヤー抽出（rough, water, bunker, collar, green）
 * - 傾斜データ抽出（upper, lower, slope）
 * - セル生成（グリーン境界内判定）
 * - 最適化（isInside: true のみ保持）
 * - viewBox固定（0, 0, 60, 60）
 * 
 * 使用方法:
 *   npx ts-node svg_to_json.ts input.svg output.json
 * 
 * Inkscape SVG要件:
 * - 各pathに data-type 属性を設定
 *   - data-type="rough" | "water" | "bunker" | "collar" | "green"
 *   - id="upper" | "lower" | "slope" （傾斜用）
 */

import * as fs from "fs";
import path from "path";
import { DOMParser } from "@xmldom/xmldom";

// ====================================
// 定数
// ====================================
const PX_PER_YARD = 20;

// レイヤー描画順（下から上）
const LAYER_ORDER = ["rough", "water", "bunker", "collar", "green"] as const;
type LayerType = typeof LAYER_ORDER[number];

// デフォルト色
const DEFAULT_COLORS: Record<LayerType, string> = {
  rough: "#90EE90",
  water: "#87CEEB",
  bunker: "#F4E5C2",
  collar: "#98FB98",
  green: "#228B22",
};

// ====================================
// 型定義
// ====================================
interface Point {
  x: number;
  y: number;
}

interface Layer {
  type: string;
  d: string;
  fill: string;
  stroke?: string;
  opacity?: string;
}

interface SlopeZone {
  d: string;
  fill: string;
  stroke?: string;
}

interface SlopeLine {
  d: string;
  fill: string;
  stroke: string;
  strokeWidth: string;
  bufferDistance?: number;
}

interface Slope {
  upper: SlopeZone;
  lower: SlopeZone;
  slope: SlopeLine;
}

interface Cell {
  id: string;
  x: number;
  y: number;
  centerX: number;
  centerY: number;
  isInside: boolean;
}

interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface OutputJson {
  hole: string;
  viewBox: ViewBox;
  boundary: { d: string };
  origin: { x: number; y: number };
  layers: Layer[];
  slope: Slope | null;
  cells: Cell[];
  grid: {
    width: number;
    height: number;
    cellSizeYd: number;
  };
  summary: {
    totalCells: number;
    insideCells: number;
  };
  extractedAt: string;
}

// ====================================
// ユーティリティ関数
// ====================================

function pxToYard(value: number): number {
  return value / PX_PER_YARD;
}

/**
 * d パスの中のすべての数値を px → yard に変換
 */
function convertPathToYard(d: string): string {
  return d.replace(
    /-?\d*\.?\d+(e[-+]?\d+)?/gi,
    (match: string): string => {
      const num = parseFloat(match);
      if (isNaN(num)) return match;
      return pxToYard(num).toFixed(2);
    }
  );
}

/**
 * style="fill:none;stroke:#xxx;..." をパース
 */
function parseStyle(style: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!style) return out;

  style.split(";").forEach((rule) => {
    const [key, val] = rule.split(":").map((s) => s.trim());
    if (key && val) {
      out[key] = val;
    }
  });

  return out;
}

/**
 * 3次ベジェ曲線の計算
 */
function cubicBezier(
  t: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number
): number {
  const mt = 1 - t;
  return (
    mt * mt * mt * p0 +
    3 * mt * mt * t * p1 +
    3 * mt * t * t * p2 +
    t * t * t * p3
  );
}

/**
 * SVG path d を座標配列にフラット化（M/m/C/c/Z対応）
 */
function flattenPath(d: string, segments = 40): Point[] {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+/g);
  if (!tokens) return [];

  const pts: Point[] = [];

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

        let c1x: number, c1y: number, c2x: number, c2y: number, ex: number, ey: number;

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
          const x = cubicBezier(t, cx, c1x, c2x, ex);
          const y = cubicBezier(t, cy, c1y, c2y, ey);
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

/**
 * ポリゴン内判定（ray casting）
 */
function isInside(px: number, py: number, pts: Point[]): boolean {
  let inside = false;

  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x;
    const yi = pts[i].y;
    const xj = pts[j].x;
    const yj = pts[j].y;

    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

// ====================================
// レイヤータイプ自動検出
// ====================================

// 傾斜タイプ
const _SLOPE_TYPES = ["upper", "lower", "slope"] as const;
type SlopeType = typeof _SLOPE_TYPES[number];

/**
 * 文字列からレイヤータイプを推測
 */
function matchLayerType(str: string | null | undefined): LayerType | null {
  if (!str) return null;
  const s = str.toLowerCase();
  
  if (s.includes("rough") || s.includes("ラフ")) return "rough";
  if (s.includes("water") || s.includes("池") || s.includes("ウォーター") || s.includes("hazard")) return "water";
  if (s.includes("bunker") || s.includes("バンカー") || s.includes("sand")) return "bunker";
  if (s.includes("collar") || s.includes("カラー") || s.includes("fringe")) return "collar";
  if (s.includes("green") || s.includes("グリーン")) return "green";
  
  return null;
}

/**
 * 文字列から傾斜タイプを推測
 */
function matchSlopeType(str: string | null | undefined): SlopeType | null {
  if (!str) return null;
  const s = str.toLowerCase();
  
  if (s.includes("upper") || s.includes("上") || s.includes("高")) return "upper";
  if (s.includes("lower") || s.includes("下") || s.includes("低")) return "lower";
  if (s.includes("slope") || s.includes("傾斜") || s.includes("段差")) return "slope";
  
  return null;
}

/**
 * fill色からレイヤータイプを推測
 */
function matchLayerTypeByColor(fill: string | null | undefined): LayerType | null {
  if (!fill) return null;
  const color = fill.toLowerCase().replace(/\s/g, "");
  
  // 色でマッチング（おおよその色）
  if (color.includes("#4ade80") || color.includes("#90ee90")) return "rough";
  if (color.includes("#0092ff") || color.includes("#87ceeb") || color.includes("#00bfff")) return "water";
  if (color.includes("#fbbf24") || color.includes("#f4e5c2") || color.includes("#daa520")) return "bunker";
  if (color.includes("#bef264") || color.includes("#98fb98")) return "collar";
  if (color.includes("#7ed9a0") || color.includes("#228b22") || color.includes("#22c55e")) return "green";
  
  return null;
}

/**
 * pathノードからレイヤータイプを自動検出
 */
function detectLayerType(node: Element): LayerType | null {
  // 1. id属性
  const id = node.getAttribute("id");
  const typeFromId = matchLayerType(id);
  if (typeFromId) return typeFromId;

  // 2. data-type属性
  const dataType = node.getAttribute("data-type");
  const typeFromDataType = matchLayerType(dataType);
  if (typeFromDataType) return typeFromDataType;

  // 3. inkscape:label
  const label = node.getAttribute("inkscape:label");
  const typeFromLabel = matchLayerType(label);
  if (typeFromLabel) return typeFromLabel;

  // 4. 親グループから推測
  const parent = node.parentNode as Element;
  if (parent && parent.nodeType === 1) {
    const parentId = parent.getAttribute("id");
    const typeFromParentId = matchLayerType(parentId);
    if (typeFromParentId) return typeFromParentId;

    const parentLabel = parent.getAttribute("inkscape:label");
    const typeFromParentLabel = matchLayerType(parentLabel);
    if (typeFromParentLabel) return typeFromParentLabel;
  }

  // 5. fill色から推測
  const style = parseStyle(node.getAttribute("style"));
  const fill = style["fill"] || node.getAttribute("fill");
  const typeFromColor = matchLayerTypeByColor(fill);
  if (typeFromColor) return typeFromColor;

  return null;
}

/**
 * pathノードから傾斜タイプを自動検出
 */
function detectSlopeType(node: Element): SlopeType | null {
  // 1. id属性
  const id = node.getAttribute("id");
  const typeFromId = matchSlopeType(id);
  if (typeFromId) return typeFromId;

  // 2. data-type属性
  const dataType = node.getAttribute("data-type");
  const typeFromDataType = matchSlopeType(dataType);
  if (typeFromDataType) return typeFromDataType;

  // 3. inkscape:label
  const label = node.getAttribute("inkscape:label");
  const typeFromLabel = matchSlopeType(label);
  if (typeFromLabel) return typeFromLabel;

  // 4. 親グループから推測
  const parent = node.parentNode as Element;
  if (parent && parent.nodeType === 1) {
    const parentId = parent.getAttribute("id");
    const typeFromParentId = matchSlopeType(parentId);
    if (typeFromParentId) return typeFromParentId;

    const parentLabel = parent.getAttribute("inkscape:label");
    const typeFromParentLabel = matchSlopeType(parentLabel);
    if (typeFromParentLabel) return typeFromParentLabel;
  }

  return null;
}

// ====================================
// SVG解析関数
// ====================================

/**
 * レイヤーを抽出（自動検出対応）
 */
function extractLayers(doc: Document): Layer[] {
  const layers: Layer[] = [];
  const pathNodes = doc.getElementsByTagName("path");

  for (let i = 0; i < pathNodes.length; i++) {
    const node = pathNodes[i];
    
    // 傾斜タイプの場合はスキップ（別途処理）
    const slopeType = detectSlopeType(node);
    if (slopeType) continue;

    // レイヤータイプを自動検出
    const layerType = detectLayerType(node);
    if (!layerType) continue;

    const rawD = node.getAttribute("d");
    if (!rawD) continue;

    const style = parseStyle(node.getAttribute("style"));

    layers.push({
      type: layerType,
      d: convertPathToYard(rawD),
      fill: style["fill"] || node.getAttribute("fill") || DEFAULT_COLORS[layerType],
      stroke: style["stroke"] || node.getAttribute("stroke") || undefined,
      opacity: style["opacity"] || style["fill-opacity"] || node.getAttribute("opacity") || undefined,
    });
  }

  // 描画順にソート
  layers.sort((a, b) => {
    const aIndex = LAYER_ORDER.indexOf(a.type as LayerType);
    const bIndex = LAYER_ORDER.indexOf(b.type as LayerType);
    return aIndex - bIndex;
  });

  return layers;
}

/**
 * 傾斜データを抽出（自動検出対応）
 */
function extractSlope(doc: Document): Slope | null {
  const pathNodes = doc.getElementsByTagName("path");
  
  let upperNode: Element | null = null;
  let lowerNode: Element | null = null;
  let slopeNode: Element | null = null;

  // 各pathノードから傾斜タイプを検出
  for (let i = 0; i < pathNodes.length; i++) {
    const node = pathNodes[i];
    const slopeType = detectSlopeType(node);
    
    if (slopeType === "upper" && !upperNode) upperNode = node;
    if (slopeType === "lower" && !lowerNode) lowerNode = node;
    if (slopeType === "slope" && !slopeNode) slopeNode = node;
  }

  // フォールバック: getElementById（従来の方法）
  if (!upperNode) upperNode = doc.getElementById("upper");
  if (!lowerNode) lowerNode = doc.getElementById("lower");
  if (!slopeNode) slopeNode = doc.getElementById("slope");

  // 3つ全部揃っていなければnull
  if (!upperNode || !lowerNode || !slopeNode) {
    return null;
  }

  const dUpper = upperNode.getAttribute("d");
  const dLower = lowerNode.getAttribute("d");
  const dSlope = slopeNode.getAttribute("d");

  if (!dUpper || !dLower || !dSlope) {
    return null;
  }

  const upperStyle = parseStyle(upperNode.getAttribute("style"));
  const lowerStyle = parseStyle(lowerNode.getAttribute("style"));
  const slopeStyle = parseStyle(slopeNode.getAttribute("style"));
  const bufferAttr = slopeNode.getAttribute("data-buffer-distance");

  return {
    upper: {
      d: convertPathToYard(dUpper),
      fill: upperStyle["fill"] || upperNode.getAttribute("fill") || "#86efac",
      stroke: upperStyle["stroke"] || upperNode.getAttribute("stroke") || undefined,
    },
    lower: {
      d: convertPathToYard(dLower),
      fill: lowerStyle["fill"] || lowerNode.getAttribute("fill") || "#7ed9a0",
      stroke: lowerStyle["stroke"] || lowerNode.getAttribute("stroke") || undefined,
    },
    slope: {
      d: convertPathToYard(dSlope),
      fill: slopeStyle["fill"] || slopeNode.getAttribute("fill") || "none",
      stroke: slopeStyle["stroke"] || slopeNode.getAttribute("stroke") || "#ff6b35",
      strokeWidth: slopeStyle["stroke-width"] || slopeNode.getAttribute("stroke-width") || "3",
      ...(bufferAttr ? { bufferDistance: parseFloat(bufferAttr) } : {}),
    },
  };
}

/**
 * セルを生成（グリーン境界内のみ）
 */
function generateCells(greenD: string): { cells: Cell[]; insideCount: number } {
  const poly = flattenPath(greenD, 40);
  
  if (poly.length === 0) {
    console.warn("⚠️ グリーン境界のパースに失敗");
    return { cells: [], insideCount: 0 };
  }

  const size = 60;
  const cells: Cell[] = [];
  let insideCount = 0;

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const cx = x + 0.5;
      const cy = y + 0.5;

      // セルの4隅と中心のいずれかが境界内にあればtrue
      const corners = [
        { x: x, y: y },
        { x: x + 1, y: y },
        { x: x, y: y + 1 },
        { x: x + 1, y: y + 1 },
        { x: cx, y: cy },
      ];

      const anyInside = corners.some((point) => isInside(point.x, point.y, poly));

      // isInside: true のセルのみ追加（最適化済み）
      if (anyInside) {
        cells.push({
          id: `cell_${x}_${y}`,
          x,
          y,
          centerX: cx,
          centerY: cy,
          isInside: true,
        });
        insideCount++;
      }
    }
  }

  return { cells, insideCount };
}

// ====================================
// メイン処理
// ====================================

function convertSvgToJson(svgPath: string, jsonPath: string): void {
  console.log("📄 SVG 読み込み:", svgPath);

  const svgText = fs.readFileSync(svgPath, "utf-8");
  const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");

  // ホール番号をファイル名から推測
  const fileMatch = path.basename(svgPath).match(/hole_(\d+)/i);
  const hole = fileMatch ? fileMatch[1] : "01";

  console.log(`🏌️ ホール番号: ${hole}`);

  // 1. レイヤー抽出
  console.log("🎨 レイヤー抽出中...");
  const layers = extractLayers(doc);
  console.log(`   → ${layers.length} レイヤー: ${layers.map((l) => l.type).join(", ")}`);

  // 2. 傾斜データ抽出
  console.log("⛰️ 傾斜データ抽出中...");
  const slope = extractSlope(doc);
  console.log(`   → ${slope ? "あり" : "なし"}`);

  // 3. グリーン境界からセル生成
  const greenLayer = layers.find((l) => l.type === "green");
  if (!greenLayer) {
    console.error("❌ エラー: type='green' のレイヤーが見つかりません");
    process.exit(1);
  }

  console.log("📐 セル生成中...");
  const { cells, insideCount } = generateCells(greenLayer.d);
  console.log(`   → ${insideCount} セル（境界内のみ）`);

  // 4. viewBox固定（0, 0, 60, 60）
  const viewBox: ViewBox = {
    x: 0,
    y: 0,
    width: 60,
    height: 60,
  };
  console.log("📐 viewBox: 0, 0, 60, 60（固定）");

  // 5. 出力JSON作成
  const output: OutputJson = {
    hole,
    viewBox,
    boundary: { d: greenLayer.d },
    origin: {
      x: 30,   // 中心線（デフォルト）
      y: 55,   // front edge基準（デフォルト）
    },
    layers,
    slope,
    cells,
    grid: {
      width: 60,
      height: 60,
      cellSizeYd: 1,
    },
    summary: {
      totalCells: 60 * 60,
      insideCells: insideCount,
    },
    extractedAt: new Date().toISOString(),
  };

  // 6. ファイル出力
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2));

  const fileSize = (fs.statSync(jsonPath).size / 1024).toFixed(1);
  console.log(`\n✅ 完了: ${jsonPath} (${fileSize}KB)`);
}

// ====================================
// CLI
// ====================================

const [, , inputSvg, outputJson] = process.argv;

if (!inputSvg || !outputJson) {
  console.error(`
使用方法:
  npx ts-node svg_to_json.ts <input.svg> <output.json>

例:
  npx ts-node svg_to_json.ts hole_01.svg output/hole_01.json

レイヤータイプの自動検出（優先順位）:
  1. data-type属性
  2. id属性（rough, water, bunker, collar, green）
  3. inkscape:label（Inkscapeレイヤー名）
  4. 親グループのid/label/data-type
  5. fill色から推測

対応デザインツール:
  - Inkscape（レイヤー名で自動判別）
  - Figma（id属性で判別）
  - Illustrator（レイヤー名 → id変換で対応）
  - Affinity Designer（id属性で判別）
  - その他（data-type属性を手動設定）

レイヤー名のキーワード（日本語対応）:
  - rough, ラフ
  - water, 池, ウォーター, hazard
  - bunker, バンカー, sand
  - collar, カラー, fringe
  - green, グリーン

傾斜データ（任意）:
  - upper, 上, 高
  - lower, 下, 低
  - slope, 傾斜, 段差

viewBox:
  - 固定値 0, 0, 60, 60 を使用
`);
  process.exit(1);
}

convertSvgToJson(inputSvg, outputJson);