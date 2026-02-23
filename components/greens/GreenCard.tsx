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
        showExit={false}
        showYardLines={false}
        showCenterLine={false}
        showBoundaryBuffer={false}
        showSlopeBuffer={false}
        showExitRoute={false}
      />
    </div>
  );
}
