import GreenCanvas from "@/components/greens/GreenCanvas";

interface GreenCardProps {
  hole: string;
}

export default function GreenCard({ hole }: GreenCardProps) {
  return (
    <div className="w-[300]">
      <div className="h-10 bg-gray-800 text-white font-bold text-center flex items-center justify-center">
        Hole {hole}
      </div>
      <GreenCanvas hole={hole} width={300} height={300} />
    </div>
  );
}
