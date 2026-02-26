import GreenCardGridPDF from "@/components/greens/GreenCardGridPDF";
import { HolePin } from "@/lib/greenCanvas.geometry";
import { Button } from "@/components/ui/button";

interface CourseGridPanelProps {
  course: "out" | "in";
  onCourseChange: (course: "out" | "in") => void;
  pins: HolePin[];
  onCardClick: (holeId: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function CourseGridPanel({
  course,
  onCourseChange,
  pins,
  onCardClick,
  selectedDate,
  onDateChange,
}: CourseGridPanelProps) {
  return (
    <div className="flex-1 min-w-0 bg-card rounded-xl shadow-sm border overflow-hidden flex flex-col">
      {/* ヘッダー: 日付ピッカー + ステータス */}
      <div className="flex-shrink-0 h-[42px] px-4 bg-gradient-to-r from-gray-700 to-gray-800 flex items-center gap-3">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="px-2 py-1 text-sm font-bold text-white bg-white/20 border border-white/30 rounded-lg cursor-pointer hover:bg-white/30 focus:outline-none"
        />
      </div>

      {/* OUT/IN切り替え */}
      <div className="flex-shrink-0 h-[44px] px-4 bg-muted border-b flex items-center justify-center gap-2">
        <Button
          size="sm"
          className={`w-20 ${course === "out" ? "bg-green-500 text-white hover:bg-green-600" : "bg-white text-gray-500 hover:bg-gray-100"}`}
          onClick={() => onCourseChange("out")}
        >
          OUT
        </Button>
        <Button
          size="sm"
          className={`w-20 ${course === "in" ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-white text-gray-500 hover:bg-gray-100"}`}
          onClick={() => onCourseChange("in")}
        >
          IN
        </Button>
      </div>

      {/* 3×3グリッド */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-2">
        <div
          style={{
            transform: `scale(0.7)`,
            transformOrigin: "center center",
          }}
        >
          <GreenCardGridPDF
            course={course}
            pins={pins}
            onCardClick={onCardClick}
          />
        </div>
      </div>
    </div>
  );
}
