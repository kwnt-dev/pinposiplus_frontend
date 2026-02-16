"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import GreenCanvas from "@/components/greens/GreenCanvas";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";

export default function StaffHoleEditPage() {
  const params = useParams();
  const holeId = params.id as string;
  const holeNumber = Number(holeId);

  const [pin, setPin] = useState<
    { id: string; x: number; y: number } | undefined
  >(undefined);
  const [pinDbId, setPinDbId] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/api/pins?hole_number=${holeNumber}`).then((response) => {
      const pins = response.data;
      if (pins.length > 0) {
        const latest = pins[pins.length - 1];
        setPin({ id: latest.id, x: latest.x, y: latest.y });
        setPinDbId(latest.id);
      }
    });
  }, [holeNumber]);

  async function handleSave() {
    if (!pin) return;

    if (pinDbId) {
      await api.delete(`/api/pins/${pinDbId}`);
    }
    const response = await api.post("/api/pins", {
      hole_number: holeNumber,
      x: pin.x,
      y: pin.y,
    });
    setPinDbId(response.data.id);
  }

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
      <Button className="mt-4" onClick={handleSave}>
        ピンを保存
      </Button>
    </div>
  );
}
