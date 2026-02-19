import GreenCanvas from "@/components/greens/GreenCanvas";
import { HolePin } from "@/lib/greenCanvas.geometry";
import { Button } from "@/components/ui/button";
import {
  checkSession,
  publishSession,
  approveSession,
  sendSession,
  PinSession,
} from "@/lib/pinSession";
import api from "@/lib/axios";

interface PinEditPanelProps {
  editingHole: number;
  editingPin: HolePin | undefined;
  damageCells: string[];
  banCells: string[];
  rainCells: string[];
  cellMode: "damage" | "ban" | "rain";
  onCellModeChange: (mode: "damage" | "ban" | "rain") => void;
  onPinDragged: (pin: { id: string; x: number; y: number }) => void;
  onCellClick: (cellId: string) => void;
  onPinSave: () => void;
  // セッション関連
  outSession: PinSession | null;
  inSession: PinSession | null;
  onOutSessionUpdate: (session: PinSession) => void;
  onInSessionUpdate: (session: PinSession) => void;
  // confirmed確認
  confirmedSessions: PinSession[];
  onConfirmedSessionsUpdate: (sessions: PinSession[]) => void;
  onReviewSession: (session: PinSession, pins: HolePin[]) => void;
  // approved送信
  approvedSessions: PinSession[];
  onApprovedSessionsUpdate: (sessions: PinSession[]) => void;
}

export default function PinEditPanel({
  editingHole,
  editingPin,
  damageCells,
  banCells,
  rainCells,
  cellMode,
  onCellModeChange,
  onPinDragged,
  onCellClick,
  onPinSave,
  outSession,
  inSession,
  onOutSessionUpdate,
  onInSessionUpdate,
  confirmedSessions,
  onConfirmedSessionsUpdate,
  onReviewSession,
  approvedSessions,
  onApprovedSessionsUpdate,
}: PinEditPanelProps) {
  return (
    <div className="p-4">
      <h2 className="font-bold mb-4">ピン編集 - Hole {editingHole}</h2>
      <GreenCanvas
        hole={String(editingHole)}
        width={400}
        height={400}
        damageCells={damageCells}
        banCells={banCells}
        rainCells={rainCells}
        currentPin={
          editingPin
            ? {
                id: `pin-${editingHole}`,
                x: editingPin.x,
                y: editingPin.y,
              }
            : undefined
        }
        onPinDragged={onPinDragged}
        onCellClick={onCellClick}
      />
      <div className="flex gap-2 mt-4">
        <Button
          variant={cellMode === "damage" ? "default" : "outline"}
          onClick={() => onCellModeChange("damage")}
        >
          傷み
        </Button>
        <Button
          variant={cellMode === "ban" ? "default" : "outline"}
          onClick={() => onCellModeChange("ban")}
        >
          禁止
        </Button>
        <Button
          variant={cellMode === "rain" ? "default" : "outline"}
          onClick={() => onCellModeChange("rain")}
        >
          雨天
        </Button>
      </div>

      <div className="mt-8 space-y-2">
        {/* ピン保存 */}
        <Button className="w-full" onClick={onPinSave}>
          ピンを保存
        </Button>
        {/* 編集完了 → checked */}
        <Button
          className="w-full"
          variant="outline"
          onClick={async () => {
            if (!outSession || !inSession) return;
            const updatedOut = await checkSession(outSession.id);
            const updatedIn = await checkSession(inSession.id);
            onOutSessionUpdate(updatedOut);
            onInSessionUpdate(updatedIn);
            alert("編集完了しました");
          }}
        >
          編集完了
        </Button>
        {/* スタッフに公開 → published */}
        <Button
          className="w-full"
          variant="outline"
          onClick={async () => {
            if (!outSession || !inSession) return;
            const updatedOut = await publishSession(outSession.id);
            const updatedIn = await publishSession(inSession.id);
            onOutSessionUpdate(updatedOut);
            onInSessionUpdate(updatedIn);
            alert("スタッフに公開しました");
          }}
        >
          スタッフに公開
        </Button>
      </div>

      {/* confirmed セッション確認エリア */}
      {confirmedSessions.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold mb-4">確認待ちセッション</h2>
          <div className="space-y-2">
            {confirmedSessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded bg-gray-50 border"
              >
                <div className="text-sm">
                  <span className="font-bold">{s.course}</span>
                  {s.target_date && ` - ${s.target_date}`}
                  <span className="ml-2 text-gray-500">
                    提出者: {s.submitted_by_name}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const res = await api.get(`/api/pin-sessions/${s.id}`);
                      const pins: HolePin[] = res.data.pins.map(
                        (p: { hole_number: number; x: number; y: number }) => ({
                          hole: p.hole_number,
                          x: p.x,
                          y: p.y,
                        }),
                      );
                      onReviewSession(s, pins);
                    }}
                  >
                    確認
                  </Button>
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await approveSession(s.id);
                        onConfirmedSessionsUpdate(
                          confirmedSessions.filter((cs) => cs.id !== s.id),
                        );
                        alert(`${s.course} を承認しました`);
                      } catch (err) {
                        console.error("承認エラー:", err);
                        alert("承認に失敗しました");
                      }
                    }}
                  >
                    承認
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* approved セッション送信エリア */}
      {approvedSessions.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold mb-4">送信待ちセッション</h2>
          <div className="space-y-2">
            {approvedSessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded bg-gray-50 border"
              >
                <div className="text-sm">
                  <span className="font-bold">{s.course}</span>
                  {s.target_date && ` - ${s.target_date}`}
                  <span className="ml-2 text-gray-500">
                    承認者: {s.approved_by}
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      await sendSession(s.id);
                      onApprovedSessionsUpdate(
                        approvedSessions.filter((as) => as.id !== s.id),
                      );
                      alert(`${s.course} をマスター室に送信しました`);
                    } catch (err) {
                      console.error("送信エラー:", err);
                      alert("送信に失敗しました");
                    }
                  }}
                >
                  マスター室に送信
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
