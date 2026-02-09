"use client";

import { useEffect, useState } from "react";
import GreenCanvas, { Pin, HoleData } from "@/components/greens/GreenCanvas";
import {
  generateProposals,
  Candidate,
  AutoProposalInput,
} from "@/lib/autoProposal";

export default function AutoSuggestTestPage() {
  const hole = "1";
  const [holeData, setHoleData] = useState<HoleData | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // localStorageからセルデータ読み込み
  const [damageCells] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(`cells_damage_${hole}`);
    return data ? JSON.parse(data) : [];
  });
  const [banCells] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(`cells_ban_${hole}`);
    return data ? JSON.parse(data) : [];
  });
  const [rainCells] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(`cells_rain_${hole}`);
    return data ? JSON.parse(data) : [];
  });

  // 過去ピン（テスト用ハードコード）
  const pastPins: Pin[] = [
    { id: "past1", x: 30, y: 20 },
    { id: "past2", x: 35, y: 47 },
  ];

  const [isRainyDay, setIsRainyDay] = useState(false);

  // JSON読み込み
  useEffect(() => {
    fetch(`/greens/hole_01.json`)
      .then((res) => res.json())
      .then((data) => setHoleData(data))
      .catch((err) => console.error("JSON読み込みエラー:", err));
  }, []);

  // 自動提案実行
  const handleGenerate = () => {
    if (!holeData) return;

    const input: AutoProposalInput = {
      holeData,
      exit: { x: 10, y: 16 },
      damageCells,
      banCells,
      rainCells,
      pastPins,
      isRainyDay,
    };

    const result = generateProposals(input);
    setCandidates(result);
    setSelectedIndex(0);

    console.log("候補数:", result.length);
    console.log("候補一覧:", result);
  };

  if (!holeData) return <div>読み込み中...</div>;

  const currentCandidate = candidates[selectedIndex];

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">自動提案テスト（Hole 1）</h1>

      {/* 操作 */}
      <div className="flex gap-4 mb-4">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handleGenerate}
        >
          自動提案実行
        </button>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isRainyDay}
            onChange={(e) => setIsRainyDay(e.target.checked)}
          />
          雨天
        </label>
      </div>

      {/* 結果 */}
      <div className="flex gap-8">
        {/* GreenCanvas */}
        <div>
          <GreenCanvas
            hole={hole}
            damageCells={damageCells}
            banCells={banCells}
            rainCells={rainCells}
            pastPins={pastPins}
            currentPin={
              currentCandidate
                ? {
                    id: "suggested",
                    x: currentCandidate.x,
                    y: currentCandidate.y,
                  }
                : undefined
            }
          />
        </div>

        {/* 候補リスト */}
        <div>
          <p className="font-bold mb-2">候補数: {candidates.length}</p>
          <p className="mb-2">
            セル数 — 禁止: {banCells.length} / ダメージ: {damageCells.length} /
            雨天: {rainCells.length}
          </p>
          <div className="max-h-[500px] overflow-y-auto">
            {candidates.map((c, i) => (
              <div
                key={`${c.x}-${c.y}`}
                className={`p-2 cursor-pointer ${
                  i === selectedIndex ? "bg-blue-100 font-bold" : ""
                }`}
                onClick={() => setSelectedIndex(i)}
              >
                #{i + 1}: x={c.x}, y={c.y}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
