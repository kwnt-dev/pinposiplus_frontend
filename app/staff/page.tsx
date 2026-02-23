"use client";

import { useRouter } from "next/navigation";

export default function StaffPage() {
  const router = useRouter();

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <header className="flex-shrink-0 h-14 px-4 bg-white border-b flex items-center justify-center">
        <h1 className="text-lg font-bold">コース選択</h1>
      </header>

      <main className="flex-1 min-h-0 flex items-center justify-center p-6">
        <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
          <div
            onClick={() => router.push("/staff/out")}
            className="aspect-square bg-white rounded-2xl shadow-sm border flex flex-col items-center justify-center cursor-pointer hover:shadow-md active:scale-95 transition-all"
          >
            <span className="text-4xl font-bold text-green-600">OUT</span>
            <span className="text-sm text-gray-500 mt-2">Hole 1 - 9</span>
          </div>
          <div
            onClick={() => router.push("/staff/in")}
            className="aspect-square bg-white rounded-2xl shadow-sm border flex flex-col items-center justify-center cursor-pointer hover:shadow-md active:scale-95 transition-all"
          >
            <span className="text-4xl font-bold text-blue-600">IN</span>
            <span className="text-sm text-gray-500 mt-2">Hole 10 - 18</span>
          </div>
        </div>
      </main>
    </div>
  );
}
