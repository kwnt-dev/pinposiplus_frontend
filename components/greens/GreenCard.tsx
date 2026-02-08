import GreenCanvas from "@/components/greens/GreenCanvas";

interface GreenCardProps {
  hole: string;
  damageCells?: string[];
  banCells?: string[];
  rainCells?: string[];
}

export default function GreenCard({
  hole,
  damageCells = [],
  banCells = [],
  rainCells = [],
}: GreenCardProps) {
  console.log("GreenCard ban:", banCells, "hole:", hole);
  return (
    <div className="w-[240]">
      <div className="h-10 bg-gray-800 text-white font-bold text-center flex items-center justify-center">
        Hole {hole}
      </div>
      <GreenCanvas
        hole={hole}
        width={240}
        height={240}
        damageCells={damageCells}
        banCells={banCells}
        rainCells={rainCells}
      />
    </div>
  );
}
