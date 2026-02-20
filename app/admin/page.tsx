"use client";

import { useState, useEffect } from "react";
import { generateProposals, AutoProposalInput } from "@/lib/autoProposal";
import {
  generateCourseProposal,
  CourseDifficulty,
  HoleCandidates,
} from "@/lib/courseProposal";
import { HOLE_CONFIGS } from "@/config/holes";
import { HoleData, Pin, HolePin } from "@/lib/greenCanvas.geometry";
import { getAutoSuggestData } from "@/lib/autoSuggest";
import {
  createPinSession,
  getPinSessions,
  approveSession,
  sendSession,
  PinSession,
} from "@/lib/pinSession";
import { format } from "date-fns";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import CourseGridPanel from "@/components/admin/CourseGridPanel";
import AutoSuggestPanel from "@/components/admin/AutoSuggestPanel";
import PinEditPanel from "@/components/admin/PinEditPanel";

export default function DashboardPage() {
  const [course, setCourse] = useState<"out" | "in">("out");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isRainyDay, setIsRainyDay] = useState(false);
  const [courseDifficulty, setCourseDifficulty] =
    useState<CourseDifficulty>("medium");

  const [allHoleData, setAllHoleData] = useState<Record<string, HoleData>>({});

  // 18ホール分のグリーンJSON読み込み
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

  const [coursePins, setCoursePins] = useState<HolePin[]>([]);
  const [rightPanelMode, setRightPanelMode] = useState<
    "auto-suggest" | "pin-edit"
  >("auto-suggest");
  const [editingHole, setEditingHole] = useState<number>(1);

  // セッション管理
  const [outSession, setOutSession] = useState<PinSession | null>(null);
  const [inSession, setInSession] = useState<PinSession | null>(null);

  // confirmed・approved セッション
  const [confirmedSessions, setConfirmedSessions] = useState<PinSession[]>([]);
  const [approvedSessions, setApprovedSessions] = useState<PinSession[]>([]);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const [confirmed, approved] = await Promise.all([
          getPinSessions({ status: "confirmed" }),
          getPinSessions({ status: "approved" }),
        ]);
        setConfirmedSessions(confirmed);
        setApprovedSessions(approved);
      } catch (err) {
        console.error("セッション取得エラー:", err);
      }
    };
    loadSessions();
  }, []);

  const [damageCellsMap, setDamageCellsMap] = useState<
    Record<number, string[]>
  >({});
  const [banCellsMap, setBanCellsMap] = useState<Record<number, string[]>>({});
  const [rainCellsMap, setRainCellsMap] = useState<Record<number, string[]>>(
    {},
  );
  const [pastPinsMap, setPastPinsMap] = useState<Record<number, Pin[]>>({});
  const [cellMode, setCellMode] = useState<"damage" | "ban" | "rain">("damage");

  // セルデータ・過去ピンをAPI取得
  useEffect(() => {
    const loadCells = async () => {
      try {
        const data = await getAutoSuggestData();

        const damageMap: Record<number, string[]> = {};
        const banMap: Record<number, string[]> = {};
        const rainMap: Record<number, string[]> = {};
        const pinsMap: Record<number, Pin[]> = {};

        for (const [hole, cells] of Object.entries(data.damage_cells)) {
          damageMap[Number(hole)] = cells.map((c) => `${c.x}-${c.y}`);
        }
        for (const [hole, cells] of Object.entries(data.ban_cells)) {
          banMap[Number(hole)] = cells.map((c) => `${c.x}-${c.y}`);
        }
        for (const [hole, cells] of Object.entries(data.rain_cells)) {
          rainMap[Number(hole)] = cells.map((c) => `${c.x}-${c.y}`);
        }
        for (const [hole, pins] of Object.entries(data.past_pins)) {
          pinsMap[Number(hole)] = pins.map((p, i) => ({
            id: `past${i + 1}`,
            x: p.x,
            y: p.y,
          }));
        }

        setDamageCellsMap(damageMap);
        setBanCellsMap(banMap);
        setRainCellsMap(rainMap);
        setPastPinsMap(pinsMap);
      } catch (err) {
        console.error("セルデータ取得エラー:", err);
      }
    };
    loadCells();
  }, []);

  // 自動提案実行 → セッション作成 → ピン生成 → ピンAPI保存
  const handleCourseGenerate = async () => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const newOutSession = await createPinSession({
      course: "OUT",
      target_date: dateStr,
      is_rainy: isRainyDay,
    });
    const newInSession = await createPinSession({
      course: "IN",
      target_date: dateStr,
      is_rainy: isRainyDay,
    });
    setOutSession(newOutSession);
    setInSession(newInSession);

    const outHoles = ["01", "02", "03", "04", "05", "06", "07", "08", "09"];
    const inHoles = ["10", "11", "12", "13", "14", "15", "16", "17", "18"];

    const generateHolePins = (holes: string[]) => {
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

        const holeNum = parseInt(h, 10);
        const input: AutoProposalInput = {
          holeData: hData,
          exit: config.exit,
          damageCells: damageCellsMap[holeNum] || [],
          banCells: banCellsMap[holeNum] || [],
          rainCells: rainCellsMap[holeNum] || [],
          pastPins: pastPinsMap[holeNum] || [],
          isRainyDay,
        };

        const candidates = generateProposals(input);
        return {
          holeNumber: holeNum,
          candidates,
          isShortHole: config.isShortHole,
          cells: hData.cells,
        };
      });

      const result = generateCourseProposal({
        holes: holeCandidates,
        courseDifficulty,
      });
      return result.holes.map((h) => ({
        hole: h.holeNumber,
        x: h.selectedPin.x,
        y: h.selectedPin.y,
      }));
    };

    const outPins = generateHolePins(outHoles);
    const inPins = generateHolePins(inHoles);

    for (const pin of outPins) {
      await api.post("/api/pins", {
        hole_number: pin.hole,
        x: pin.x,
        y: pin.y,
        session_id: newOutSession.id,
      });
    }
    for (const pin of inPins) {
      await api.post("/api/pins", {
        hole_number: pin.hole,
        x: pin.x,
        y: pin.y,
        session_id: newInSession.id,
      });
    }

    const allPins: HolePin[] = [...outPins, ...inPins];
    setCoursePins(allPins);
    setRightPanelMode("pin-edit");
    setEditingHole(1);
  };

  const editingPin = coursePins.find((p) => p.hole === editingHole);

  // ピン編集後にAPI保存
  const handlePinSave = async () => {
    const pin = coursePins.find((p) => p.hole === editingHole);
    if (!pin) return;

    const currentSession = course === "out" ? outSession : inSession;
    if (!currentSession) return;

    const existing = await api.get(`/api/pins?hole_number=${editingHole}`);
    const sessionPins = existing.data.filter(
      (p: { session_id: string }) => p.session_id === currentSession.id,
    );
    for (const p of sessionPins) {
      await api.delete(`/api/pins/${p.id}`);
    }

    await api.post("/api/pins", {
      hole_number: editingHole,
      x: pin.x,
      y: pin.y,
      session_id: currentSession.id,
    });
  };

  const handleCellClick = (cellId: string) => {
    const updateCells =
      cellMode === "damage"
        ? setDamageCellsMap
        : cellMode === "ban"
          ? setBanCellsMap
          : setRainCellsMap;

    updateCells((prev) => {
      const currentCells = prev[editingHole] || [];
      const isAlreadySelected = currentCells.includes(cellId);
      return {
        ...prev,
        [editingHole]: isAlreadySelected
          ? currentCells.filter((id: string) => id !== cellId)
          : [...currentCells, cellId],
      };
    });
  };

  return (
    <div>
      <h1>ダッシュボード</h1>
      <div className="flex gap-4">
        <CourseGridPanel
          course={course}
          onCourseChange={setCourse}
          pins={coursePins}
          onCardClick={(holeId) => setEditingHole(Number(holeId))}
          outSession={outSession}
          inSession={inSession}
        />
        <div className="flex-1">
          {rightPanelMode === "auto-suggest" ? (
            <AutoSuggestPanel
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              isRainyDay={isRainyDay}
              onRainyDayChange={setIsRainyDay}
              courseDifficulty={courseDifficulty}
              onDifficultyChange={setCourseDifficulty}
              onGenerate={handleCourseGenerate}
            />
          ) : (
            <PinEditPanel
              editingHole={editingHole}
              editingPin={editingPin}
              damageCells={damageCellsMap[editingHole] || []}
              banCells={banCellsMap[editingHole] || []}
              rainCells={rainCellsMap[editingHole] || []}
              cellMode={cellMode}
              onCellModeChange={setCellMode}
              onPinDragged={(pin) => {
                setCoursePins((prev) =>
                  prev.map((p) =>
                    p.hole === editingHole ? { ...p, x: pin.x, y: pin.y } : p,
                  ),
                );
              }}
              onCellClick={handleCellClick}
              onPinSave={handlePinSave}
              outSession={outSession}
              inSession={inSession}
              onOutSessionUpdate={setOutSession}
              onInSessionUpdate={setInSession}
            />
          )}
        </div>
      </div>

      {/* confirmed セッション確認エリア（常に表示） */}
      {confirmedSessions.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold mb-4">確認待ちセッション</h2>
          <div className="space-y-2">
            {confirmedSessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded bg-gray-50 border"
              >
                <div className="text-sm">
                  <span className="font-bold">{s.course}</span>
                  {s.target_date && ` - ${s.target_date}`}
                  <span className="ml-2 text-gray-500">
                    提出者: {s.submitted_by_name}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const res = await api.get(`/api/pin-sessions/${s.id}`);
                      const pins: HolePin[] = res.data.pins.map(
                        (p: { hole_number: number; x: number; y: number }) => ({
                          hole: p.hole_number,
                          x: p.x,
                          y: p.y,
                        }),
                      );
                      setCoursePins(pins);
                      setCourse(s.course === "OUT" ? "out" : "in");
                      setRightPanelMode("pin-edit");
                    }}
                  >
                    確認
                  </Button>
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await approveSession(s.id);
                        setConfirmedSessions((prev) =>
                          prev.filter((cs) => cs.id !== s.id),
                        );
                        alert(`${s.course} を承認しました`);
                      } catch (err) {
                        console.error("承認エラー:", err);
                        alert("承認に失敗しました");
                      }
                    }}
                  >
                    承認
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* approved セッション送信エリア（常に表示） */}
      {approvedSessions.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold mb-4">送信待ちセッション</h2>
          <div className="space-y-2">
            {approvedSessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded bg-gray-50 border"
              >
                <div className="text-sm">
                  <span className="font-bold">{s.course}</span>
                  {s.target_date && ` - ${s.target_date}`}
                </div>
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      await sendSession(s.id);
                      setApprovedSessions((prev) =>
                        prev.filter((as) => as.id !== s.id),
                      );
                      alert(`${s.course} をマスター室に送信しました`);
                    } catch (err) {
                      console.error("送信エラー:", err);
                      alert("送信に失敗しました");
                    }
                  }}
                >
                  マスター室に送信
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
