import GreenCanvas from "@/components/greens/GreenCanvas";

interface GreenCardProps {
  hole: string;
}

export default function GreenCard({ hole }: GreenCardProps) {
  return (
    <div className="w-[600]">
      <div className="h-10 bg-gray-800 text-white font-bold text-center flex items-center justify-center">
        Hole {hole}
      </div>
      <GreenCanvas hole={hole} />
    </div>
  );
}
