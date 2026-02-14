import GreenCard from "@/components/greens/GreenCard";

interface GreenCardGridProps {
  course: "out" | "in";
  onCardClick?: (holeId: string) => void;
  holeDamageCells?: { hole: number; cellIds: string[] }[];
  holeBanCells?: { hole: number; cellIds: string[] }[];
  holeRainCells?: { hole: number; cellIds: string[] }[];
}

export default function GreenCardGrid({
  course,
  onCardClick,
  holeDamageCells,
  holeBanCells,
  holeRainCells,
}: GreenCardGridProps) {
  const holes =
    course === "out"
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9]
      : [10, 11, 12, 13, 14, 15, 16, 17, 18];

  return (
    <div className="grid grid-cols-3 gap-4" style={{ width: 752 }}>
      {holes.map((hole) => {
        const damage = holeDamageCells?.find((c) => c.hole === hole);
        const ban = holeBanCells?.find((c) => c.hole === hole);
        const rain = holeRainCells?.find((c) => c.hole === hole);

        return (
          <div key={hole} onClick={() => onCardClick?.(String(hole))}>
            <GreenCard
              hole={String(hole)}
              damageCells={damage?.cellIds}
              banCells={ban?.cellIds}
              rainCells={rain?.cellIds}
            />
          </div>
        );
      })}
    </div>
  );
}
