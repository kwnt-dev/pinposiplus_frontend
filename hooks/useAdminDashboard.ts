import { useState, useEffect, useCallback } from "react";
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
  getPinSessionDetail,
  PinSession,
} from "@/lib/pinSession";
import { format } from "date-fns";
import api from "@/lib/axios";
import { toast } from "sonner";

export function useAdminDashboard() {
  const [course, setCourse] = useState<"out" | "in">("out");
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [isRainyDay, setIsRainyDay] = useState(false);
  const [courseDifficulty, setCourseDifficulty] =
    useState<CourseDifficulty>("medium");

  const [allHoleData, setAllHoleData] = useState<Record<string, HoleData>>({});
  const [coursePins, setCoursePins] = useState<HolePin[]>([]);
  const [rightPanelMode, setRightPanelMode] = useState<
    "auto-suggest" | "pin-edit"
  >("auto-suggest");
  const [editingHole, setEditingHole] = useState<number>(1);

  const [outSession, setOutSession] = useState<PinSession | null>(null);
  const [inSession, setInSession] = useState<PinSession | null>(null);

  const [damageCellsMap, setDamageCellsMap] = useState<
    Record<number, string[]>
  >({});
  const [banCellsMap, setBanCellsMap] = useState<Record<number, string[]>>({});
  const [rainCellsMap, setRainCellsMap] = useState<Record<number, string[]>>(
    {},
  );
  const [pastPinsMap, setPastPinsMap] = useState<Record<number, Pin[]>>({});

  const [savedPins, setSavedPins] = useState<
    Record<number, { x: number; y: number }>
  >({});
  const [dirtyHole, setDirtyHole] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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

  // セッション読み込み（useEffectから呼ぶ用）
  useEffect(() => {
    let cancelled = false;

    async function loadSessions() {
      try {
        const sessions = await getPinSessions({ target_date: selectedDate });
        if (cancelled) return;

        const out = sessions.find((s) => s.course === "OUT");
        const in_ = sessions.find((s) => s.course === "IN");
        setOutSession(out || null);
        setInSession(in_ || null);

        const allPins: HolePin[] = [];
        if (out) {
          const outDetail = await getPinSessionDetail(out.id);
          const pins =
            outDetail.pins?.map(
              (p: { hole_number: number; x: number; y: number }) => ({
                hole: p.hole_number,
                x: p.x,
                y: p.y,
              }),
            ) || [];
          allPins.push(...pins);
        }
        if (in_) {
          const inDetail = await getPinSessionDetail(in_.id);
          const pins =
            inDetail.pins?.map(
              (p: { hole_number: number; x: number; y: number }) => ({
                hole: p.hole_number,
                x: p.x,
                y: p.y,
              }),
            ) || [];
          allPins.push(...pins);
        }

        if (cancelled) return;
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
    }

    loadSessions();
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  // 外部から呼ぶ用（公開・確認後のリロード）
  const reloadSessions = async () => {
    const sessions = await getPinSessions({ target_date: selectedDate });
    const out = sessions.find((s) => s.course === "OUT");
    const in_ = sessions.find((s) => s.course === "IN");
    setOutSession(out || null);
    setInSession(in_ || null);
  };

  // セルデータ・過去ピン取得
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

  // 自動提案実行
  const handleCourseGenerate = async () => {
    setIsGenerating(true);
    try {
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
    } finally {
      setIsGenerating(false);
    }
  };

  // ホール切り替え
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

  // ピン保存
  const handlePinSave = async () => {
    const pin = coursePins.find((p) => p.hole === editingHole);
    if (!pin) return;

    const currentSession = course === "out" ? outSession : inSession;
    if (!currentSession) return;

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
    toast.success("ピンを保存しました");
  };

  // ピン位置変更（ドラッグ）
  const handlePinPlaced = (pin: { id: string; x: number; y: number }) => {
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
  };

  const editingPin = coursePins.find((p) => p.hole === editingHole);

  return {
    course,
    setCourse,
    selectedDate,
    setSelectedDate,
    isRainyDay,
    setIsRainyDay,
    courseDifficulty,
    setCourseDifficulty,
    coursePins,
    rightPanelMode,
    editingHole,
    editingPin,
    outSession,
    inSession,
    damageCellsMap,
    banCellsMap,
    rainCellsMap,
    pastPinsMap,
    reloadSessions,
    handleCourseGenerate,
    handleHoleChange,
    handlePinSave,
    handlePinPlaced,
    isGenerating,
  };
}
