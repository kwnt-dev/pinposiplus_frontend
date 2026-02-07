"use client";

import { useEffect, useState } from "react";
import GreenCanvas, { Pin, HoleData } from "@/components/greens/GreenCanvas";
import { useParams } from "next/navigation";

export default function PinEditPage() {
  const { id } = useParams();
  const hole = id as string;

  const pastPins = [
    { id: "past1", x: 30, y: 20 },
    { id: "past2", x: 35, y: 47 },
  ];

  const [currentPin, setCurrentPin] = useState<Pin>(() => {
    if (typeof window === "undefined") return { id: "pin1", x: 30, y: 35 };
    const data = localStorage.getItem(`pin_${hole}`);
    return data ? JSON.parse(data) : { id: "pin1", x: 30, y: 35 };
  });

  function handlePinDragged(newPin: Pin) {
    console.log("新しい座標", newPin);
    setCurrentPin(newPin);
  }
  const [holeData, setHoleData] = useState<HoleData | null>(null);

  // SVGベジェ曲線上の1点の座標を計算する関数
  function calcBezierPoint(
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
  function svgPathToPoints(
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

  function getBoundaryIntersectionY(
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

  useEffect(() => {
    const paddedHole = hole.padStart(2, "0");
    fetch(`/greens/hole_${paddedHole}.json`)
      .then((res) => res.json())
      .then((data) => setHoleData(data))
      .catch((err) => console.error("JSON読み込みエラー:", err));
  }, [hole]);

  if (!holeData) {
    return <div>読み込み中...</div>;
  }

  // 0.5刻みに丸める（例: 3.1→3.0, 3.3→3.5, 3.8→4.0）
  const roundToHalf = (value: number) => Math.round(value * 2) / 2;

  const depth = Math.round(holeData.origin.y - currentPin.y);
  const edges = getBoundaryIntersectionY(holeData.boundary.d, currentPin.y);

  let horizontal = "";
  if (Math.abs(currentPin.x - 30) < 0.5) {
    horizontal = "C(中心線)";
  } else if (currentPin.x > 30 && edges) {
    const dist = roundToHalf(edges.right - currentPin.x);
    horizontal = `右外周から${dist}yd`;
  } else if (edges) {
    const dist = roundToHalf(currentPin.x - edges.left);
    horizontal = `左外周から${dist}yd`;
  }

  return (
    <div>
      {`奥行${Math.round(holeData.origin.y - currentPin.y)}yd, ${horizontal}`}
      <button
        onClick={() => {
          console.log("保存クリック");
          localStorage.setItem(`pin_${hole}`, JSON.stringify(currentPin));
        }}
      >
        保存
      </button>
      <GreenCanvas
        hole={hole}
        currentPin={currentPin}
        onPinDragged={handlePinDragged}
      />
    </div>
  );
}
