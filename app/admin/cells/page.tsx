"use client";

import { useState } from "react";
import GreenCardGrid from "@/components/greens/GreenCardGrid";
import { useRouter } from "next/navigation";

export default function CellsPage() {
  const [course, setCourse] = useState<"out" | "in">("out");
  const router = useRouter();

  return (
    <div className="p-8">
      <button onClick={() => setCourse("out")}>OUT</button>
      <button onClick={() => setCourse("in")}>IN</button>
      <GreenCardGrid
        course={course}
        onCardClick={(holeId) => router.push(`/admin/cells/${holeId}`)}
      />
    </div>
  );
}
