import GreenCanvas from "@/components/greens/GreenCanvas";
import { HolePin } from "@/lib/greenCanvas.geometry";
import { Button } from "@/components/ui/button";
import { checkSession, publishSession, PinSession } from "@/lib/pinSession";
import { MapPin } from "lucide-react";

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
  outSession: PinSession | null;
  inSession: PinSession | null;
  onOutSessionUpdate: (session: PinSession) => void;
  onInSessionUpdate: (session: PinSession) => void;
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
}: PinEditPanelProps) {
  return (
    <div className="flex-1 min-w-0 bg-card rounded-xl shadow-sm border overflow-hidden flex flex-col">
      {/* ヘッダーバー */}
      <div className="flex-shrink-0 h-[42px] px-4 bg-blue-600 flex items-center gap-2">
        <MapPin size={16} className="text-white" />
        <h2 className="text-sm font-bold text-white">
          ピン編集 - Hole {editingHole}
        </h2>
      </div>

      {/* トグルボタン */}
      <div className="flex-shrink-0 h-[44px] px-4 bg-muted border-b flex items-center gap-2">
        <Button
          size="sm"
          variant={cellMode === "damage" ? "default" : "outline"}
          onClick={() => onCellModeChange("damage")}
        >
          傷み
        </Button>
        <Button
          size="sm"
          variant={cellMode === "ban" ? "default" : "outline"}
          onClick={() => onCellModeChange("ban")}
        >
          禁止
        </Button>
        <Button
          size="sm"
          variant={cellMode === "rain" ? "default" : "outline"}
          onClick={() => onCellModeChange("rain")}
        >
          雨天
        </Button>
      </div>

      {/* キャンバス */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-2">
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
      </div>

      {/* アクションボタン */}
      <div className="flex-shrink-0 p-4 border-t space-y-2">
        <Button className="w-full" onClick={onPinSave}>
          ピンを保存
        </Button>
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
    </div>
  );
}
