"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import GreenCardGridPDF from "@/components/greens/GreenCardGridPDF";
import { getPinSessions, confirmSession, PinSession } from "@/lib/pinSession";
import { HolePin } from "@/lib/greenCanvas.geometry";
import api from "@/lib/axios";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const weekday = weekdays[date.getDay()];
  return `${month}月${day}日（${weekday}）`;
}

export default function StaffInPage() {
  const router = useRouter();
  const [session, setSession] = useState<PinSession | null>(null);
  const [pins, setPins] = useState<HolePin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function calculateScale() {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const availableWidth = clientWidth - 32;
      const availableHeight = clientHeight - 32;
      const originalWidth = 752;
      const originalHeight = 870;
      const scaleX = availableWidth / originalWidth;
      const scaleY = availableHeight / originalHeight;
      setScale(Math.min(scaleX, scaleY, 1));
    }
    calculateScale();
    window.addEventListener("resize", calculateScale);
    return () => window.removeEventListener("resize", calculateScale);
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessions = await getPinSessions({
          status: ["published", "confirmed"],
          course: "IN",
        });
        if (sessions.length > 0) {
          const latest = sessions[0];
          setSession(latest);

          const res = await api.get(`/api/pin-sessions/${latest.id}`);
          const sessionPins: HolePin[] = res.data.pins.map(
            (p: { hole_number: number; x: number; y: number }) => ({
              hole: p.hole_number,
              x: p.x,
              y: p.y,
            }),
          );
          setPins(sessionPins);
        }
      } catch (err) {
        console.error("セッション取得エラー:", err);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const handleConfirm = async () => {
    if (!session) return;

    setIsConfirming(true);
    try {
      const updated = await confirmSession(session.id);
      setSession(updated);
    } catch (err) {
      console.error("確認提出エラー:", err);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* ヘッダー */}
      <header className="flex-shrink-0 h-14 px-4 bg-white border-b flex items-center justify-between">
        <button
          onClick={() => router.push("/staff")}
          className="text-sm font-medium text-gray-600"
        >
          ← 戻る
        </button>
        <h1 className="text-lg font-bold">IN</h1>
        <div className="w-12" />
      </header>

      {/* セッション情報バー */}
      {session && (
        <div className="flex-shrink-0 h-10 px-4 bg-gray-100 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-700">
              {formatDate(session.target_date)}
            </span>
            {session.event_name && (
              <span className="text-xs bg-purple-500/80 text-white px-2 py-0.5 rounded">
                {session.event_name}
              </span>
            )}
            {session.groups_count != null && (
              <span className="text-sm text-green-600 font-bold">
                {session.groups_count}組
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {session.status === "confirmed" && (
              <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium">
                完了報告済み
              </span>
            )}
            {session.status === "published" && (
              <button
                onClick={handleConfirm}
                disabled={isConfirming}
                className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-bold disabled:opacity-50"
              >
                完了報告
              </button>
            )}
          </div>
        </div>
      )}

      {/* グリッド */}
      <main
        ref={containerRef}
        className="flex-1 min-h-0 flex items-center justify-center"
      >
        {session && !loading && (
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "center center",
            }}
          >
            <GreenCardGridPDF
              course="in"
              pins={pins}
              onCardClick={
                session.status === "published"
                  ? (holeId) =>
                      router.push(
                        `/staff/hole/${holeId}?session_id=${session.id}`,
                      )
                  : undefined
              }
            />
          </div>
        )}
      </main>
    </div>
  );
}
