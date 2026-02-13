"use client";

import { useState } from "react";
import GreenCardGrid from "@/components/greens/GreenCardGrid";

export default function TestPage() {
  const [course, setCourse] = useState<"out" | "in">("out");

  return (
    <div className="p-8">
      <button onClick={() => setCourse("out")}>OUT</button>
      <button onClick={() => setCourse("in")}>IN</button>
      <GreenCardGrid course={course} />
    </div>
  );
}
