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

export default function DashboardPage() {
  const [course, setCourse] = useState<"out" | "in">("out");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isRainyDay, setIsRainyDay] = useState(false);
  const [courseDifficulty, setCourseDifficulty] =
    useState<CourseDifficulty>("medium");

  const [allHoleData, setAllHoleData] = useState<Record<string, HoleData>>({});

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

  const handleCourseGenerate = () => {
    const holes =
      course === "out"
        ? ["01", "02", "03", "04", "05", "06", "07", "08", "09"]
        : ["10", "11", "12", "13", "14", "15", "16", "17", "18"];

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

      const input: AutoProposalInput = {
        holeData: hData,
        exit: config.exit,
        damageCells: [],
        banCells: [],
        rainCells: [],
        pastPins: [],
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

    const result = generateCourseProposal({
      holes: holeCandidates,
      courseDifficulty,
    });
    const pins: HolePin[] = result.holes.map((h) => ({
      hole: h.holeNumber,
      x: h.selectedPin.x,
      y: h.selectedPin.y,
    }));

    setCoursePins(pins);
    setRightPanelMode("pin-edit");
    setEditingHole(course === "out" ? 1 : 10);
  };

  const editingPin = coursePins.find((p) => p.hole === editingHole);

  return (
    <div>
      <h1>ダッシュボード</h1>
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
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
