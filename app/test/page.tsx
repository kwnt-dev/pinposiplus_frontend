"use client";

import GreenCanvas from "@/components/greens/GreenCanvas";

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">GreenCanvas テスト</h1>
      <GreenCanvas hole="1" />
    </div>
  );
}
