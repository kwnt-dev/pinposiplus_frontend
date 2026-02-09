"use client";

import { useState } from "react";
import GreenCardPDFExport from "@/components/greens/GreenCardPDFExport";

export default function TestPDFPage() {
  const [hole, setHole] = useState("1");

  const testPin = { id: "pin1", x: 30, y: 35 };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">PDF Export テスト</h1>

      <div className="flex gap-2 mb-4">
        {Array.from({ length: 18 }, (_, i) => i + 1).map((h) => (
          <button
            key={h}
            onClick={() => setHole(String(h))}
            className={`px-3 py-1 border rounded ${
              hole === String(h) ? "bg-gray-800 text-white" : "bg-white"
            }`}
          >
            {h}
          </button>
        ))}
      </div>

      <div className="inline-block border">
        <GreenCardPDFExport hole={hole} currentPin={testPin} />
      </div>
    </div>
  );
}
