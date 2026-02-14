"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import GreenCardGrid from "@/components/greens/GreenCardGrid";

export default function CellsEditPage() {
  const [course, setCourse] = useState<"out" | "in">("out");
  const [selectedHole, setSelectedHole] = useState<number>(1);

  return (
    <div>
      <h1>セル編集</h1>
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="p-4">
            <div className="flex justify-center gap-2">
              <Button
                variant={course === "out" ? "default" : "outline"}
                onClick={() => {
                  setCourse("out");
                  setSelectedHole(1);
                }}
              >
                OUT
              </Button>
              <Button
                variant={course === "in" ? "default" : "outline"}
                onClick={() => {
                  setCourse("in");
                  setSelectedHole(10);
                }}
              >
                IN
              </Button>
            </div>
            <div
              style={{
                transform: `scale(0.7)`,
                transformOrigin: "top left",
              }}
            >
              <GreenCardGrid
                course={course}
                onCardClick={(holeId) => setSelectedHole(Number(holeId))}
              />
            </div>
          </div>
        </div>
        <div className="flex-1">右パネル</div>
      </div>
    </div>
  );
}
