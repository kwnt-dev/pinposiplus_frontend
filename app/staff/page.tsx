"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getPinSessions, PinSession } from "@/lib/pinSession";
import { LogOut } from "lucide-react";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const weekday = weekdays[date.getDay()];
  return `${month}/${day}（${weekday}）`;
}

export default function StaffPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [outSession, setOutSession] = useState<PinSession | null>(null);
  const [inSession, setInSession] = useState<PinSession | null>(null);

  useEffect(() => {
    async function loadSessions() {
      try {
        const [outSessions, inSessions] = await Promise.all([
          getPinSessions({ status: ["published", "confirmed"], course: "OUT" }),
          getPinSessions({ status: ["published", "confirmed"], course: "IN" }),
        ]);
        if (outSessions.length > 0) setOutSession(outSessions[0]);
        if (inSessions.length > 0) setInSession(inSessions[0]);
      } catch (err) {
        console.error("セッション取得エラー:", err);
      }
    }
    loadSessions();
  }, []);

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
            {outSession && (
              <span className="text-xs text-gray-400 mt-1">
                {formatDate(outSession.target_date)}
              </span>
            )}
            {outSession && (
              <span
                className={`mt-2 px-2 py-0.5 rounded text-xs font-medium ${
                  outSession.status === "confirmed"
                    ? "bg-gray-200 text-gray-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {outSession.status === "confirmed"
                  ? "完了報告済み"
                  : "作業待ち"}
              </span>
            )}
          </div>
          <div
            onClick={() => router.push("/staff/in")}
            className="aspect-square bg-white rounded-2xl shadow-sm border flex flex-col items-center justify-center cursor-pointer hover:shadow-md active:scale-95 transition-all"
          >
            <span className="text-4xl font-bold text-blue-600">IN</span>
            <span className="text-sm text-gray-500 mt-2">Hole 10 - 18</span>
            {inSession && (
              <span className="text-xs text-gray-400 mt-1">
                {formatDate(inSession.target_date)}
              </span>
            )}
            {inSession && (
              <span
                className={`mt-2 px-2 py-0.5 rounded text-xs font-medium ${
                  inSession.status === "confirmed"
                    ? "bg-gray-200 text-gray-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {inSession.status === "confirmed" ? "完了報告済み" : "作業待ち"}
              </span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
