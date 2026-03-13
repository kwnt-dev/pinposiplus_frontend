import { useState, useEffect } from "react";
import { HoleData } from "@/lib/greenCanvas.geometry";

/** ホール番号に対応するグリーンのJSON データを取得するフック */
export function useHoleData(hole: string): HoleData | null {
  const [holeData, setHoleData] = useState<HoleData | null>(null);

  useEffect(() => {
    const paddedHole = hole.padStart(2, "0");
    fetch(`/greens/hole_${paddedHole}.json`)
      .then((res) => res.json())
      .then((data) => setHoleData(data))
      .catch((err) => console.error("JSON読み込みエラー:", err));
  }, [hole]);

  return holeData;
}
