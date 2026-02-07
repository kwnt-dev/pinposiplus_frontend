"use client";

import { useState } from "react";
import GreenCanvas, { Pin } from "@/components/greens/GreenCanvas";
import { useParams } from "next/navigation";

export default function PinEditPage() {
  const { id } = useParams();
  const hole = id as string;

  const pastPins = [
    { id: "past1", x: 30, y: 20 },
    { id: "past2", x: 35, y: 47 },
  ];

  const [currentPin, setCurrentPin] = useState<Pin>({
    id: "pin1",
    x: 30,
    y: 35,
  });

  function handlePinDragged(newPin: Pin) {
    console.log("新しい座標", newPin);
    setCurrentPin(newPin);
  }

  return (
    <div>
      <GreenCanvas
        hole={hole}
        currentPin={currentPin}
        onPinDragged={handlePinDragged}
      />
    </div>
  );
}
