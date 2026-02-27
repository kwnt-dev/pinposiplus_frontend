"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  publishSession,
  PinSession,
} from "@/lib/pinSession";
import { format } from "date-fns";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { ShieldCheck, Eye, Send, ClipboardList } from "lucide-react";
import CourseGridPanel from "@/components/admin/CourseGridPanel";
import AutoSuggestPanel from "@/components/admin/AutoSuggestPanel";
import PinEditPanel from "@/components/admin/PinEditPanel";

// ステータスバッジ
function StatusBadge({ session }: { session: PinSession | null }) {
  if (!session) {
    return (
      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
        未作成
      </span>
    );
  }

  switch (session.status) {
    case "draft":
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
          作成中
        </span>
      );
    case "published":
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
          <Eye size={12} /> スタッフ公開中
        </span>
      );
    case "confirmed":
      return (
        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
          <ClipboardList size={12} /> スタッフ確認済み
        </span>
      );
    case "sent":
      return (
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
          <Send size={12} /> 送信済み
        </span>
      );
    default:
      return null;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [course, setCourse] = useState<"out" | "in">("out");
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
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

  // セッション読み込み（選択日付でフィルタ）
  const loadSessions = async () => {
    try {
      const sessions = await getPinSessions({ target_date: selectedDate });
      const out = sessions.find((s) => s.course === "OUT");
      const in_ = sessions.find((s) => s.course === "IN");
      setOutSession(out || null);
      setInSession(in_ || null);

      // セッションのピンをグリッドに反映
      const allPins: HolePin[] = [];
      if (out) {
        const res = await api.get(`/api/pin-sessions/${out.id}`);
        const pins =
          res.data.pins?.map(
            (p: { hole_number: number; x: number; y: number }) => ({
              hole: p.hole_number,
              x: p.x,
              y: p.y,
            }),
          ) || [];
        allPins.push(...pins);
      }
      if (in_) {
        const res = await api.get(`/api/pin-sessions/${in_.id}`);
        const pins =
          res.data.pins?.map(
            (p: { hole_number: number; x: number; y: number }) => ({
              hole: p.hole_number,
              x: p.x,
              y: p.y,
            }),
          ) || [];
        allPins.push(...pins);
      }
      setCoursePins(allPins);
      const isSent = out?.status === "sent" || in_?.status === "sent";
      if (allPins.length > 0 && !isSent) {
        setRightPanelMode("pin-edit");
      } else {
        setRightPanelMode("auto-suggest");
      }
    } catch (err) {
      console.error("セッション取得エラー:", err);
    }
  };

  useEffect(() => {
    const load = async () => {
      await loadSessions();
    };
    load();
  }, [selectedDate]);

  const [damageCellsMap, setDamageCellsMap] = useState<
    Record<number, string[]>
  >({});
  const [banCellsMap, setBanCellsMap] = useState<Record<number, string[]>>({});
  const [rainCellsMap, setRainCellsMap] = useState<Record<number, string[]>>(
    {},
  );
  const [pastPinsMap, setPastPinsMap] = useState<Record<number, Pin[]>>({});

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
          damageMap[Number(hole)] = cells.map((c) => `cell_${c.x}_${c.y}`);
        }
        for (const [hole, cells] of Object.entries(data.ban_cells)) {
          banMap[Number(hole)] = cells.map((c) => `cell_${c.x}_${c.y}`);
        }
        for (const [hole, cells] of Object.entries(data.rain_cells)) {
          rainMap[Number(hole)] = cells.map((c) => `cell_${c.x}_${c.y}`);
        }
        for (const [hole, pins] of Object.entries(data.past_pins)) {
          pinsMap[Number(hole)] = pins.map((p, i) => ({
            id: `past${i + 1}`,
            x: p.x,
            y: p.y,
            date: p.date,
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
  }, [selectedDate]);

  // 自動提案実行 → セッション作成 → ピン生成 → ピンAPI保存
  const handleCourseGenerate = async () => {
    // 当日の予定表データを取得
    let eventName: string | undefined;
    let groupsCount: number | undefined;
    try {
      const scheduleRes = await api.get(
        `/api/schedules?start_date=${selectedDate}&end_date=${selectedDate}`,
      );
      if (scheduleRes.data.length > 0) {
        eventName = scheduleRes.data[0].event_name || undefined;
        groupsCount = scheduleRes.data[0].group_count ?? undefined;
      }
    } catch (err) {
      console.error("予定表取得エラー:", err);
    }

    const newOutSession = await createPinSession({
      course: "OUT",
      target_date: selectedDate,
      is_rainy: isRainyDay,
      event_name: eventName,
      groups_count: groupsCount,
    });
    const newInSession = await createPinSession({
      course: "IN",
      target_date: selectedDate,
      is_rainy: isRainyDay,
      event_name: eventName,
      groups_count: groupsCount,
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
    setOutSession(newOutSession);
    setInSession(newInSession);
    setRightPanelMode("pin-edit");
    setEditingHole(1);
  };

  const editingPin = coursePins.find((p) => p.hole === editingHole);

  // 未保存のドラッグ変更を管理
  const [savedPins, setSavedPins] = useState<
    Record<number, { x: number; y: number }>
  >({});
  const [dirtyHole, setDirtyHole] = useState<number | null>(null);

  // ホール切替時に未保存なら元に戻す
  const handleHoleChange = (holeId: number) => {
    if (dirtyHole !== null && savedPins[dirtyHole]) {
      setCoursePins((prev) =>
        prev.map((p) =>
          p.hole === dirtyHole
            ? { ...p, x: savedPins[dirtyHole].x, y: savedPins[dirtyHole].y }
            : p,
        ),
      );
    }
    setDirtyHole(null);
    setEditingHole(holeId);
    setRightPanelMode("pin-edit");
  };

  // ピン編集後にAPI保存
  const handlePinSave = async () => {
    const pin = coursePins.find((p) => p.hole === editingHole);
    if (!pin) return;

    const currentSession = course === "out" ? outSession : inSession;
    if (!currentSession) return;

    // 保存済みとして記録（元に戻す必要なくなる）
    setSavedPins((prev) => ({
      ...prev,
      [editingHole]: { x: pin.x, y: pin.y },
    }));
    setDirtyHole(null);

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

  return (
    <div className="h-full flex flex-col p-4">
      <PageHeader icon={ShieldCheck} title="ダッシュボード">
        <StatusBadge session={course === "out" ? outSession : inSession} />
        <Button
          size="sm"
          className="bg-green-500 text-white hover:bg-green-600"
          disabled={
            !outSession ||
            !inSession ||
            outSession.status !== "draft" ||
            inSession.status !== "draft"
          }
          onClick={async () => {
            if (!outSession || !inSession) return;
            try {
              await publishSession(outSession.id);
              await publishSession(inSession.id);
              await loadSessions();
            } catch (err) {
              console.error("公開エラー:", err);
            }
          }}
        >
          <Eye size={14} className="mr-1" />
          スタッフに公開
        </Button>
        <Button
          size="sm"
          className="bg-blue-500 text-white hover:bg-blue-600"
          disabled={
            !outSession ||
            !inSession ||
            outSession.status !== "confirmed" ||
            inSession.status !== "confirmed"
          }
          onClick={() => {
            router.push(`/admin/pdf-preview?send=true&date=${selectedDate}`);
          }}
        >
          <Send size={14} className="mr-1" />
          マスター室に送信
        </Button>
      </PageHeader>

      {/* メインコンテンツ: 左グリッド + 右パネル */}
      <div className="flex-1 min-h-0 flex gap-4">
        <CourseGridPanel
          course={course}
          onCourseChange={setCourse}
          pins={coursePins}
          onCardClick={(holeId) => {
            const isSent =
              outSession?.status === "sent" || inSession?.status === "sent";
            if (isSent) return;
            handleHoleChange(Number(holeId));
          }}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
        {rightPanelMode === "auto-suggest" ? (
          <AutoSuggestPanel
            selectedDate={new Date(selectedDate + "T00:00:00")}
            onDateChange={(date) => setSelectedDate(format(date, "yyyy-MM-dd"))}
            isRainyDay={isRainyDay}
            onRainyDayChange={setIsRainyDay}
            courseDifficulty={courseDifficulty}
            onDifficultyChange={setCourseDifficulty}
            onGenerate={handleCourseGenerate}
            disabled={
              outSession?.status === "sent" || inSession?.status === "sent"
            }
          />
        ) : (
          <PinEditPanel
            editingHole={editingHole}
            editingPin={editingPin}
            damageCells={damageCellsMap[editingHole] || []}
            banCells={banCellsMap[editingHole] || []}
            rainCells={rainCellsMap[editingHole] || []}
            pastPins={pastPinsMap[editingHole] || []}
            readOnly={
              outSession?.status === "sent" || inSession?.status === "sent"
            }
            onPinDragged={(pin) => {
              // 初回ドラッグ時に元の位置を保存
              if (dirtyHole !== editingHole) {
                const original = coursePins.find((p) => p.hole === editingHole);
                if (original) {
                  setSavedPins((prev) => ({
                    ...prev,
                    [editingHole]: { x: original.x, y: original.y },
                  }));
                }
                setDirtyHole(editingHole);
              }
              setCoursePins((prev) =>
                prev.map((p) =>
                  p.hole === editingHole ? { ...p, x: pin.x, y: pin.y } : p,
                ),
              );
            }}
            onPinSave={handlePinSave}
            isRainyDay={isRainyDay}
          />
        )}
      </div>
    </div>
  );
}
