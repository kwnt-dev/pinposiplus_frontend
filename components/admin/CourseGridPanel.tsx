import GreenCardGridPDF from "@/components/greens/GreenCardGridPDF";
import { HolePin } from "@/lib/greenCanvas.geometry";
import { Button } from "@/components/ui/button";
import { PinSession } from "@/lib/pinSession";

interface CourseGridPanelProps {
  course: "out" | "in";
  onCourseChange: (course: "out" | "in") => void;
  pins: HolePin[];
  onCardClick: (holeId: string) => void;
  outSession: PinSession | null;
  inSession: PinSession | null;
}

export default function CourseGridPanel({
  course,
  onCourseChange,
  pins,
  onCardClick,
  outSession,
  inSession,
}: CourseGridPanelProps) {
  return (
    <div className="flex-1 min-w-0 bg-card rounded-xl shadow-sm border overflow-hidden flex flex-col">
      {/* セッションステータスヘッダー */}
      <div className="flex-shrink-0 h-[42px] px-4 bg-gradient-to-r from-gray-700 to-gray-800 flex items-center gap-3">
        {outSession ? (
          <span className="text-sm text-white font-medium">
            OUT: {outSession.status}
          </span>
        ) : (
          <span className="text-sm text-white/60">OUT: 未作成</span>
        )}
        {inSession ? (
          <span className="text-sm text-white font-medium">
            IN: {inSession.status}
          </span>
        ) : (
          <span className="text-sm text-white/60">IN: 未作成</span>
        )}
      </div>

      {/* OUT/IN切り替え */}
      <div className="flex-shrink-0 h-[44px] px-4 bg-muted border-b flex items-center justify-center gap-2">
        <Button
          size="sm"
          variant={course === "out" ? "default" : "outline"}
          onClick={() => onCourseChange("out")}
        >
          OUT
        </Button>
        <Button
          size="sm"
          variant={course === "in" ? "default" : "outline"}
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
