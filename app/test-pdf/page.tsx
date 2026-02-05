"use client";

import { useState } from "react";
import GreenCardPDF from "@/components/greens/GreenCardPDF";
import GreenCanvas, { Pin } from "@/components/greens/GreenCanvas";

export default function PDFTestPage() {
  const [currentPin, setCurrentPin] = useState<Pin>({
    id: "pin1",
    x: 35,
    y: 45,
  });
  return (
    <div className="p-8">
      <GreenCardPDF hole="9" currentPin={currentPin} />
    </div>
  );
}
