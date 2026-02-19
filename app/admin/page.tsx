"use client";

import { useState, useEffect } from "react";
import GreenCanvas from "@/components/greens/GreenCanvas";
import GreenCardGridPDF from "@/components/greens/GreenCardGridPDF";
import { generateProposals, AutoProposalInput } from "@/lib/autoProposal";
import {
  generateCourseProposal,
  CourseDifficulty,
  HoleCandidates,
} from "@/lib/courseProposal";
import { HOLE_CONFIGS } from "@/config/holes";
import { HoleData, Pin, HolePin } from "@/lib/greenCanvas.geometry";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAutoSuggestData } from "@/lib/autoSuggest";
import {
  createPinSession,
  checkSession,
  publishSession,
  approveSession,
  sendSession,
  getPinSessions,
  PinSession,
} from "@/lib/pinSession";
import api from "@/lib/axios";

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
    "auto-suggest" | "pin-edit" | "confirm-review"
  >("auto-suggest");
  const [editingHole, setEditingHole] = useState<number>(1);

  // セッション管理
  const [outSession, setOutSession] = useState<PinSession | null>(null);
  const [inSession, setInSession] = useState<PinSession | null>(null);

  // confirmed セッション確認用
  const [confirmedSessions, setConfirmedSessions] = useState<PinSession[]>([]);
  const [reviewingSession, setReviewingSession] = useState<PinSession | null>(
    null,
  );
  const [reviewPins, setReviewPins] = useState<HolePin[]>([]);

  // approved セッション送信用
  const [approvedSessions, setApprovedSessions] = useState<PinSession[]>([]);

  // confirmed・approvedセッション取得
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

    // OUT/INセッション作成
    const outSess = await createPinSession({
      course: "OUT",
      target_date: dateStr,
      is_rainy: isRainyDay,
    });
    const inSess = await createPinSession({
      course: "IN",
      target_date: dateStr,
      is_rainy: isRainyDay,
    });
    setOutSession(outSess);
    setInSession(inSess);

    // 18ホール分のピン生成
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

    // OUT/INそれぞれのピンをAPI保存
    for (const pin of outPins) {
      await api.post("/api/pins", {
        hole_number: pin.hole,
        x: pin.x,
        y: pin.y,
        session_id: outSess.id,
      });
    }
    for (const pin of inPins) {
      await api.post("/api/pins", {
        hole_number: pin.hole,
        x: pin.x,
        y: pin.y,
        session_id: inSess.id,
      });
    }

    const allPins: HolePin[] = [...outPins, ...inPins];
    setCoursePins(allPins);
    setRightPanelMode("pin-edit");
    setEditingHole(course === "out" ? 1 : 10);
  };

  const editingPin = coursePins.find((p) => p.hole === editingHole);

  // ピン編集後にAPI保存
  const handlePinSave = async () => {
    const pin = coursePins.find((p) => p.hole === editingHole);
    if (!pin) return;

    const currentSession = course === "out" ? outSession : inSession;
    if (!currentSession) return;

    // 該当ホールの既存ピンを削除して新規保存
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
      {/* セッションステータス表示 */}
      {(outSession || inSession) && (
        <div className="flex gap-4 mb-4">
          {outSession && (
            <div className="px-3 py-1 rounded bg-gray-100 text-sm">
              OUT: {outSession.status}
            </div>
          )}
          {inSession && (
            <div className="px-3 py-1 rounded bg-gray-100 text-sm">
              IN: {inSession.status}
            </div>
          )}
        </div>
      )}
      <div className="flex gap-4">
        <div className="flex-1">
          {/* 左パネル */}
          <div className="flex justify-center gap-2">
            <Button
              variant={course === "out" ? "default" : "outline"}
              onClick={() => setCourse("out")}
            >
              OUT
            </Button>
            <Button
              variant={course === "in" ? "default" : "outline"}
              onClick={() => setCourse("in")}
            >
              IN
            </Button>
          </div>
          <div
            style={{
              transform: `scale(0.7)`,
              transformOrigin: "top left",
            }}
          >
            <GreenCardGridPDF
              course={course}
              pins={coursePins}
              onCardClick={(holeId) => setEditingHole(Number(holeId))}
            />
          </div>
        </div>
        <div className="flex-1">
          {rightPanelMode === "auto-suggest" ? (
            <div className="p-4">
              <h2 className="font-bold mb-4">自動提案設定</h2>
              <div>
                <Label>日付</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full mt-1">
                      {format(selectedDate, "yyyy-MM-dd")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Switch checked={isRainyDay} onCheckedChange={setIsRainyDay} />
                <Label>雨天モード</Label>
              </div>
              <div className="mt-4">
                <Label>コース難易度</Label>
                <Select
                  value={courseDifficulty}
                  onValueChange={(v) =>
                    setCourseDifficulty(v as CourseDifficulty)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full mt-6" onClick={handleCourseGenerate}>
                自動提案を実行
              </Button>
            </div>
          ) : (
            <div className="p-4">
              <h2 className="font-bold mb-4">ピン編集 - Hole {editingHole}</h2>
              <GreenCanvas
                hole={String(editingHole)}
                width={400}
                height={400}
                damageCells={damageCellsMap[editingHole] || []}
                banCells={banCellsMap[editingHole] || []}
                rainCells={rainCellsMap[editingHole] || []}
                currentPin={
                  editingPin
                    ? {
                        id: `pin-${editingHole}`,
                        x: editingPin.x,
                        y: editingPin.y,
                      }
                    : undefined
                }
                onPinDragged={(pin) => {
                  setCoursePins((prev) =>
                    prev.map((p) =>
                      p.hole === editingHole ? { ...p, x: pin.x, y: pin.y } : p,
                    ),
                  );
                }}
                onCellClick={handleCellClick}
              />
              <div className="flex gap-2 mt-4">
                <Button
                  variant={cellMode === "damage" ? "default" : "outline"}
                  onClick={() => setCellMode("damage")}
                >
                  傷み
                </Button>
                <Button
                  variant={cellMode === "ban" ? "default" : "outline"}
                  onClick={() => setCellMode("ban")}
                >
                  禁止
                </Button>
                <Button
                  variant={cellMode === "rain" ? "default" : "outline"}
                  onClick={() => setCellMode("rain")}
                >
                  雨天
                </Button>
              </div>

              <div className="mt-8 space-y-2">
                {/* ピン保存 */}
                <Button className="w-full" onClick={handlePinSave}>
                  ピンを保存
                </Button>
                {/* 編集完了 → checked */}
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={async () => {
                    if (!outSession || !inSession) return;
                    const updatedOut = await checkSession(outSession.id);
                    const updatedIn = await checkSession(inSession.id);
                    setOutSession(updatedOut);
                    setInSession(updatedIn);
                    alert("編集完了しました");
                  }}
                >
                  編集完了
                </Button>
                {/* スタッフに公開 → published */}
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={async () => {
                    if (!outSession || !inSession) return;
                    const updatedOut = await publishSession(outSession.id);
                    const updatedIn = await publishSession(inSession.id);
                    setOutSession(updatedOut);
                    setInSession(updatedIn);
                    alert("スタッフに公開しました");
                  }}
                >
                  スタッフに公開
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* confirmed セッション確認エリア */}
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
                      setReviewingSession(s);
                      setReviewPins(pins);
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
                        setReviewingSession(null);
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

      {/* approved セッション送信エリア */}
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
                  <span className="ml-2 text-gray-500">
                    承認者: {s.approved_by}
                  </span>
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
