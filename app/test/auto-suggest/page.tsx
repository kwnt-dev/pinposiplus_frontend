"use client";

import { useEffect, useState } from "react";
import GreenCanvas from "@/components/greens/GreenCanvas";
import { Pin, HoleData } from "@/lib/greenCanvas.geometry";
import GreenCardGridPDF from "@/components/greens/GreenCardGridPDF";
import { HolePin } from "@/lib/greenCanvas.geometry";
import {
  generateProposals,
  Candidate,
  AutoProposalInput,
} from "@/lib/autoProposal";
import {
  generateCourseProposal,
  CourseDifficulty,
  HoleCandidates,
  CourseProposalInput,
} from "@/lib/courseProposal";
import { HOLE_CONFIGS } from "@/config/holes";

export default function AutoSuggestTestPage() {
  // ==========================================
  // 1ホール詳細（上部）
  // ==========================================
  const [selectedHole, setSelectedHole] = useState("1");
  const [holeData, setHoleData] = useState<HoleData | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [damageCells, setDamageCells] = useState<string[]>([]);
  const [banCells, setBanCells] = useState<string[]>([]);
  const [rainCells, setRainCells] = useState<string[]>([]);

  // 過去ピンテストデータ（1日前, 2日前）
  const PAST_PINS_DATA: Record<number, { x: number; y: number }[]> = {
    1: [
      { x: 25, y: 48 },
      { x: 35, y: 33 },
    ],
    2: [
      { x: 37.5, y: 40 },
      { x: 26, y: 30 },
    ],
    3: [
      { x: 25, y: 29 },
      { x: 35, y: 38 },
    ],
    4: [
      { x: 30, y: 46 },
      { x: 27, y: 24 },
    ],
    5: [
      { x: 33, y: 43 },
      { x: 33, y: 28 },
    ],
    6: [
      { x: 28, y: 28 },
      { x: 30, y: 45 },
    ],
    7: [
      { x: 31.5, y: 47 },
      { x: 30, y: 27 },
    ],
    8: [
      { x: 32, y: 33 },
      { x: 20, y: 41 },
    ],
    9: [
      { x: 37.5, y: 43 },
      { x: 28, y: 25 },
    ],
    10: [
      { x: 22, y: 35 },
      { x: 38, y: 38 },
    ],
    11: [
      { x: 35.5, y: 41 },
      { x: 27.5, y: 27 },
    ],
    12: [
      { x: 24.5, y: 24 },
      { x: 27, y: 40 },
    ],
    13: [
      { x: 35, y: 45 },
      { x: 30, y: 21 },
    ],
    14: [
      { x: 25, y: 44 },
      { x: 33, y: 32 },
    ],
    15: [
      { x: 33.5, y: 27 },
      { x: 35, y: 42 },
    ],
    16: [
      { x: 15.5, y: 35 },
      { x: 40, y: 43 },
    ],
    17: [
      { x: 35.5, y: 37 },
      { x: 18, y: 45 },
    ],
    18: [
      { x: 29, y: 26 },
      { x: 33, y: 43 },
    ],
  };

  const pastPins: Pin[] = (PAST_PINS_DATA[parseInt(selectedHole)] || []).map(
    (p, i) => ({ id: `past${i + 1}`, x: p.x, y: p.y }),
  );

  const [isRainyDay, setIsRainyDay] = useState(false);

  // ホール変更時にJSON＋localStorageを再読み込み
  useEffect(() => {
    const paddedHole = selectedHole.padStart(2, "0");
    fetch(`/greens/hole_${paddedHole}.json`)
      .then((res) => res.json())
      .then((data) => {
        setHoleData(data);
        setDamageCells(
          JSON.parse(
            localStorage.getItem(`cells_damage_${selectedHole}`) || "[]",
          ),
        );
        setBanCells(
          JSON.parse(localStorage.getItem(`cells_ban_${selectedHole}`) || "[]"),
        );
        setRainCells(
          JSON.parse(
            localStorage.getItem(`cells_rain_${selectedHole}`) || "[]",
          ),
        );
        setCandidates([]);
      })
      .catch((err) => console.error("JSON読み込みエラー:", err));
  }, [selectedHole]);

  // 1ホール自動提案
  const handleGenerate = () => {
    if (!holeData) return;
    const paddedHole = selectedHole.padStart(2, "0");
    const config = HOLE_CONFIGS[paddedHole];
    if (!config) return;

    const input: AutoProposalInput = {
      holeData,
      exit: config.exit,
      damageCells,
      banCells,
      rainCells,
      pastPins,
      isRainyDay,
    };

    const result = generateProposals(input);
    setCandidates(result);
    console.log(`Hole ${selectedHole} 候補数:`, result.length);
  };

  // ==========================================
  // 9ホール全体（下部）
  // ==========================================
  const [courseDifficulty, setCourseDifficulty] =
    useState<CourseDifficulty>("medium");
  const [course, setCourse] = useState<"out" | "in">("out");
  const [coursePins, setCoursePins] = useState<HolePin[]>([]);
  const [allHoleData, setAllHoleData] = useState<Record<string, HoleData>>({});

  // 18ホール分のJSON読み込み
  useEffect(() => {
    const loadAll = async () => {
      const data: Record<string, HoleData> = {};
      for (let i = 1; i <= 18; i++) {
        const paddedHole = String(i).padStart(2, "0");
        try {
          const res = await fetch(`/greens/hole_${paddedHole}.json`);
          const json = await res.json();
          data[paddedHole] = json;
        } catch (err) {
          console.error(`hole_${paddedHole} 読み込みエラー:`, err);
        }
      }
      setAllHoleData(data);
    };
    loadAll();
  }, []);

  // 9ホール全体提案
  const handleCourseGenerate = () => {
    const holes =
      course === "out"
        ? ["01", "02", "03", "04", "05", "06", "07", "08", "09"]
        : ["10", "11", "12", "13", "14", "15", "16", "17", "18"];

    // 各ホールの候補を生成
    const holeCandidates: HoleCandidates[] = holes.map((h) => {
      const hData = allHoleData[h];
      const config = HOLE_CONFIGS[h];
      if (!hData || !config) {
        return {
          holeNumber: parseInt(h, 10),
          candidates: [],
          isShortHole: false,
          cells: [],
        };
      }

      // localStorageからセルデータ取得
      const holeNum = String(parseInt(h, 10));
      const damage = JSON.parse(
        localStorage.getItem(`cells_damage_${holeNum}`) || "[]",
      );
      const ban = JSON.parse(
        localStorage.getItem(`cells_ban_${holeNum}`) || "[]",
      );
      const rain = JSON.parse(
        localStorage.getItem(`cells_rain_${holeNum}`) || "[]",
      );

      const holePastPins: Pin[] = (PAST_PINS_DATA[parseInt(h, 10)] || []).map(
        (p, i) => ({ id: `past${i + 1}`, x: p.x, y: p.y }),
      );

      const input: AutoProposalInput = {
        holeData: hData,
        exit: config.exit,
        damageCells: damage,
        banCells: ban,
        rainCells: rain,
        pastPins: holePastPins,
        isRainyDay,
      };

      const candidates = generateProposals(input);

      return {
        holeNumber: parseInt(h, 10),
        candidates,
        isShortHole: config.isShortHole,
        cells: hData.cells,
      };
    });

    // 9ホール全体バランスで選択
    const courseInput: CourseProposalInput = {
      holes: holeCandidates,
      courseDifficulty,
    };

    const result = generateCourseProposal(courseInput);

    // GreenCardGridPDF用に変換
    const pins: HolePin[] = result.holes.map((h) => ({
      hole: h.holeNumber,
      x: h.selectedPin.x,
      y: h.selectedPin.y,
    }));

    setCoursePins(pins);
    console.log("9ホール結果:", result);
  };

  if (!holeData) return <div>読み込み中...</div>;

  return (
    <div className="p-8">
      {/* ==========================================
          上部: 1ホール詳細
          ========================================== */}
      <h1 className="text-xl font-bold mb-4">1ホール詳細</h1>
      <div className="flex gap-4 mb-4">
        <select
          className="border px-4 py-2 rounded"
          value={selectedHole}
          onChange={(e) => setSelectedHole(e.target.value)}
        >
          {Array.from({ length: 18 }, (_, i) => (
            <option key={i + 1} value={String(i + 1)}>
              Hole {i + 1}
            </option>
          ))}
        </select>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handleGenerate}
        >
          1ホール提案実行
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

      <div className="flex gap-8 mb-12">
        <div>
          <GreenCanvas
            hole={selectedHole}
            damageCells={damageCells}
            banCells={banCells}
            rainCells={rainCells}
            pastPins={pastPins}
            suggestedPins={candidates}
          />
        </div>
        <div>
          <p className="font-bold mb-2">候補数: {candidates.length}</p>
          <p className="mb-2">
            セル数 — 禁止: {banCells.length} / ダメージ: {damageCells.length} /
            雨天: {rainCells.length}
          </p>
        </div>
      </div>

      {/* ==========================================
          下部: 9ホール全体
          ========================================== */}
      <hr className="mb-8" />
      <h1 className="text-xl font-bold mb-4">9ホール全体バランス</h1>

      <div className="flex gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${course === "out" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setCourse("out")}
        >
          OUT
        </button>
        <button
          className={`px-4 py-2 rounded ${course === "in" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setCourse("in")}
        >
          IN
        </button>

        <select
          className="border px-4 py-2 rounded"
          value={courseDifficulty}
          onChange={(e) =>
            setCourseDifficulty(e.target.value as CourseDifficulty)
          }
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={handleCourseGenerate}
        >
          9ホール提案実行
        </button>
      </div>

      <div className="mb-4">
        <p className="font-bold">
          選択結果:{" "}
          {coursePins.map((p) => `H${p.hole}(${p.x},${p.y})`).join(" / ")}
        </p>
      </div>

      <GreenCardGridPDF course={course} pins={coursePins} />
    </div>
  );
}
