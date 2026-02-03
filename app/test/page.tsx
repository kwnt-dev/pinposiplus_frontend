"use client";

import GreenCanvas from "@/components/greens/GreenCanvas";

const testDamageCells = ["cell_30_40", "cell_31_40", "cell_32_40"];

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">GreenCanvas テスト</h1>
      <GreenCanvas hole="1" damageCells={testDamageCells} />
    </div>
  );
}
