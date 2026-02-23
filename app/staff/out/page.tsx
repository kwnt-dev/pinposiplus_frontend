"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import GreenCardGridPDF from "@/components/greens/GreenCardGridPDF";
import { getPinSessions, confirmSession, PinSession } from "@/lib/pinSession";
import { HolePin } from "@/lib/greenCanvas.geometry";
import api from "@/lib/axios";

export default function StaffOutPage() {
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
          status: "published",
          course: "OUT",
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
      <header className="flex-shrink-0 h-14 px-4 bg-white border-b flex items-center relative">
        <button
          onClick={() => router.push("/staff")}
          className="text-sm font-medium text-gray-600"
        >
          ← 戻る
        </button>
        <h1 className="text-lg font-bold absolute left-1/2 -translate-x-1/2">
          OUT
        </h1>
        <div className="ml-auto flex items-center gap-2">
          {session && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
              {session.status}
            </span>
          )}
          {session?.status === "published" && (
            <button
              onClick={handleConfirm}
              disabled={isConfirming}
              className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-bold disabled:opacity-50"
            >
              完了報告
            </button>
          )}
        </div>
      </header>

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
              course="out"
              pins={pins}
              onCardClick={(holeId) =>
                router.push(`/staff/hole/${holeId}?session_id=${session.id}`)
              }
            />
          </div>
        )}
      </main>
    </div>
  );
}
