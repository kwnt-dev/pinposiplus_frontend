"use client";

import { useState } from "react";
import GreenCardGridPDF, {
  HolePin,
} from "@/components/greens/GreenCardGridPDF";
import { useRouter } from "next/navigation";

export default function AutoSuggestPage() {
  const [course, setCourse] = useState<"out" | "in">("out");
  const router = useRouter();

  return (
    <div className="p-8">
      <button onClick={() => setCourse("out")}>OUT</button>
      <button onClick={() => setCourse("in")}>IN</button>
      <GreenCardGridPDF
        course={course}
        onCardClick={(holeId) => router.push(`/hole/${holeId}/edit-pin`)}
        pins={[]}
      />
    </div>
  );
}
