"use client";

import { useState } from "react";
import GreenCardGridPDF from "@/components/greens/GreenCardGridPDF";

export default function DashboardPage() {
  const [course, setCourse] = useState<"out" | "in">("out");

  return (
    <div>
      <h1>ダッシュボード</h1>
      <div>
        <div className="flex-1">
          {/* 左パネル */}
          <button onClick={() => setCourse("out")}>OUT</button>
          <button onClick={() => setCourse("in")}>IN</button>
          <div
            style={{
              transform: `scale(0.7)`,
              transformOrigin: "top left",
            }}
          >
            <GreenCardGridPDF course={course} />
          </div>
        </div>
        <div className="flex-1">{/* 右パネル　*/}右</div>
      </div>
    </div>
  );
}
