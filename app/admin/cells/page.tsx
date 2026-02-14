"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function CellsEditPage() {
  const [course, setCourse] = useState<"out" | "in">("out");

  return (
    <div>
      <h1>セル編集</h1>
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="p-4">
            <div className="flex justify-center gap-2">
              <Button
                variant={course === "out" ? "default" : "outline"}
                onClick={() => setCourse("out")}
              >
                OUT
              </Button>
              <Button
                variant={course === "in" ? "default" : "outline"}
                onClick={() => setCourse("in")}
              >
                IN
              </Button>
            </div>
          </div>
        </div>
        <div className="flex-1">右パネル</div>
      </div>
    </div>
  );
}
