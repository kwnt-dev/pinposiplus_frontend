import GreenCanvas from "@/components/greens/GreenCanvas";

interface GreenCardProps {
  hole: string;
  damageCells?: string[];
}

export default function GreenCard({ hole, damageCells = [] }: GreenCardProps) {
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
      />
    </div>
  );
}
