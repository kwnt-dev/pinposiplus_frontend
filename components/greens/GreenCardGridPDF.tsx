import GreenCardPDF from "@/components/greens/GreenCardPDF";
import { HolePin } from "@/lib/greenCanvas.geometry";

interface GreenCardGridPDFProps {
  course: "out" | "in";
  onCardClick?: (holeId: string) => void;
  pins?: HolePin[];
}

export default function GreenCardGridPDF({
  course,
  onCardClick,
  pins,
}: GreenCardGridPDFProps) {
  const holes =
    course === "out"
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9]
      : [10, 11, 12, 13, 14, 15, 16, 17, 18];

  return (
    <div className="grid grid-cols-3 gap-4" style={{ width: 752 }}>
      {holes.map((hole) => {
        const pin = pins?.find((p) => p.hole === hole);
        return (
          <div
            key={hole}
            onClick={() => onCardClick?.(String(hole))}
            className={
              onCardClick
                ? "cursor-pointer hover:opacity-80 active:scale-95 transition-all"
                : ""
            }
          >
            <GreenCardPDF
              hole={String(hole)}
              currentPin={
                pin ? { id: `pin-${hole}`, x: pin.x, y: pin.y } : undefined
              }
            />
          </div>
        );
      })}
    </div>
  );
}
