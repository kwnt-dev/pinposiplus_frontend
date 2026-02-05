import GreenCanvas from "@/components/greens/GreenCanvas";

interface GreenCardProps {
  hole: string;
}

export default function GreenCard({ hole }: GreenCardProps) {
  return (
    <div>
      <GreenCanvas hole={hole} />
    </div>
  );
}
