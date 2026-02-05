import GreenCard from "@/components/greens/GreenCard";

interface GreenCardGridProps {
  course: "out" | "in";
  onCardClick?: (holeId: string) => void;
}

export default function GreenCardGrid({ course, onCardClick }: GreenCardGridProps) {
  const holes =
    course === "out"
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9]
      : [10, 11, 12, 13, 14, 15, 16, 17, 18];

  return (
    < className="grid grid-cols-3 gap-16">
      {holes.map((hole) => (
        <div onClick={() => onCardClick?.(String(hole))}>
        <GreenCard key={hole} hole={String(hole)} />
      </div>
      ))}
      
  );
}
