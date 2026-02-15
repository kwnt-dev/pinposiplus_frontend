"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import GreenCanvas from "@/components/greens/GreenCanvas";
import { Button } from "@/components/ui/button";

export default function StaffHoleEditPage() {
  const params = useParams();
  const holeId = params.id as string;

  const [pin, setPin] = useState<
    { id: string; x: number; y: number } | undefined
  >(undefined);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Hole {holeId}</h1>
      <GreenCanvas
        hole={holeId}
        width={400}
        height={400}
        currentPin={pin}
        onPinDragged={(newPin) => setPin(newPin)}
      />
      <Button
        className="mt-4"
        onClick={() => {
          console.log("ピン保存", { hole: holeId, pin });
        }}
      >
        ピンを保存
      </Button>
    </div>
  );
}
