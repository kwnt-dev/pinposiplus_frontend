"use client";

import { useState } from "react";
import GreenCardGridPDF, {
  HolePin,
} from "@/components/greens/GreenCardGridPDF";
import { useRouter } from "next/navigation";

export default function AutoSuggestPage() {
  const [course, setCourse] = useState<"out" | "in">("out");
  const router = useRouter();
  const [pins, setPins] = useState<HolePin[]>(() => {
    if (typeof window === "undefined") return [];
    const loadedPins: HolePin[] = [];
    for (let i = 1; i <= 18; i++) {
      const data = localStorage.getItem(`pin_${i}`);
      if (data) {
        const pin = JSON.parse(data);
        loadedPins.push({ hole: i, x: pin.x, y: pin.y });
      }
    }
    return loadedPins;
  });

  return (
    <div className="p-8">
      <button onClick={() => setCourse("out")}>OUT</button>
      <button onClick={() => setCourse("in")}>IN</button>
      <GreenCardGridPDF
        course={course}
        onCardClick={(holeId) => router.push(`/hole/${holeId}/edit-pin`)}
        pins={pins}
      />
    </div>
  );
}
