"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";

export default function StaffPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <header className="flex-shrink-0 h-14 px-4 bg-white border-b flex items-center justify-between">
        <span className="text-sm text-gray-500">{user?.name}</span>
        <h1 className="text-lg font-bold">スタッフホーム</h1>
        <button
          onClick={logout}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <LogOut size={16} />
          ログアウト
        </button>
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
