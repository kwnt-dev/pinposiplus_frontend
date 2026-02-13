// 定数
export const YD_TO_PX = 20;
export const CANVAS_SIZE = 60 * YD_TO_PX;

/** SVGパスの数値をヤード→ピクセルに変換する */
export function scalePathToPixels(d: string): string {
  return d.replace(/-?\d+\.?\d*(e[-+]?\d+)?/gi, (match) =>
    Math.round(parseFloat(match) * YD_TO_PX).toString(),
  );
}

/** ヤードをピクセルに変換する */
export function ydToPx(yd: number): number {
  return yd * YD_TO_PX;
}
