"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GreenCardGridPDF from "@/components/greens/GreenCardGridPDF";
import { getPinSessions, confirmSession, PinSession } from "@/lib/pinSession";
import { HolePin } from "@/lib/greenCanvas.geometry";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";

export default function StaffOutPage() {
  const router = useRouter();
  const [session, setSession] = useState<PinSession | null>(null);
  const [pins, setPins] = useState<HolePin[]>([]);
  const [loading, setLoading] = useState(true);

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

    try {
      const updated = await confirmSession(session.id);
      setSession(updated);
      alert("確認提出しました");
    } catch (err) {
      console.error("確認提出エラー:", err);
      alert("確認提出に失敗しました");
    }
  };

  if (loading) {
    return <div className="p-8">読み込み中...</div>;
  }

  if (!session) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">OUT</h1>
        <p className="text-gray-500">公開中のセッションがありません</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">OUT</h1>
      <div className="mb-4 px-3 py-1 rounded bg-gray-100 text-sm inline-block">
        ステータス: {session.status}
      </div>
      <GreenCardGridPDF
        course="out"
        pins={pins}
        onCardClick={(holeId) =>
          router.push(`/staff/hole/${holeId}?session_id=${session.id}`)
        }
      />
      {session.status === "published" && (
        <Button className="mt-6 w-full" onClick={handleConfirm}>
          確認提出
        </Button>
      )}
    </div>
  );
}
