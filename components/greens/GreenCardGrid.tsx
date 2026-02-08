import GreenCard from "@/components/greens/GreenCard";

interface GreenCardGridProps {
  course: "out" | "in";
  onCardClick?: (holeId: string) => void;
  holeDamageCells?: { hole: number; cellIds: string[] }[];
}

export default function GreenCardGrid({
  course,
  onCardClick,
  holeDamageCells,
}: GreenCardGridProps) {
  const holes =
    course === "out"
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9]
      : [10, 11, 12, 13, 14, 15, 16, 17, 18];

  return (
    <div className="grid grid-cols-3 gap-16">
      {holes.map((hole) => {
        const damage = holeDamageCells?.find((c) => c.hole === hole);

        return (
          <div key={hole} onClick={() => onCardClick?.(String(hole))}>
            <GreenCard hole={String(hole)} damageCells={damage?.cellIds} />
          </div>
        );
      })}
    </div>
  );
}
