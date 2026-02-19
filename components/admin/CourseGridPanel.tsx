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
    <div className="flex-1">
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

      {/* OUT/IN切り替え */}
      <div className="flex justify-center gap-2">
        <Button
          variant={course === "out" ? "default" : "outline"}
          onClick={() => onCourseChange("out")}
        >
          OUT
        </Button>
        <Button
          variant={course === "in" ? "default" : "outline"}
          onClick={() => onCourseChange("in")}
        >
          IN
        </Button>
      </div>

      {/* 3×3グリッド */}
      <div
        style={{
          transform: `scale(0.7)`,
          transformOrigin: "top left",
        }}
      >
        <GreenCardGridPDF
          course={course}
          pins={pins}
          onCardClick={onCardClick}
        />
      </div>
    </div>
  );
}
