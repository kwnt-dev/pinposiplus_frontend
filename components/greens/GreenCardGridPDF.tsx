import GreenCardPDF from "@/components/greens/GreenCardPDF";

interface GreenCardGridPDFProps {
  course: "out" | "in";
  onCardClick?: (holeId: string) => void;
  testPins: HolePin[];
}

export interface HolePin {
  hole: number;
  x: number;
  y: number;
}

export default function GreenCardGridPDF({
  course,
  onCardClick,
  testPins,
}: GreenCardGridPDFProps) {
  const holes =
    course === "out"
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9]
      : [10, 11, 12, 13, 14, 15, 16, 17, 18];

  return (
    <div className="grid grid-cols-3 gap-16">
      {holes.map((hole) => {
        const pin = testPins.find((p) => p.hole === hole);
        return (
          <div key={hole} onClick={() => onCardClick?.(String(hole))}>
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
