import GreenCanvas from "@/components/greens/GreenCanvas";
import { use } from "react";

interface Prop {
  params: Promise<{ hole: string }>;
}

export default function Page({ params }: Prop) {
  const { hole } = use(params);

  return (
    <div>
      <GreenCanvas hole={hole} />
    </div>
  );
}
