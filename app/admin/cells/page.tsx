"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { Grid3x3, Pencil, Save } from "lucide-react";
import GreenCardGrid from "@/components/greens/GreenCardGrid";
import GreenCanvas from "@/components/greens/GreenCanvas";
import {
  getCellGroups,
  createCellGroup,
  deleteCellGroup,
  CellGroup,
} from "@/lib/cellGroups";

type CellType = "damage" | "ban" | "rain";

// 登録済みセルをcellId形式に変換（表示用）
function groupsToCellIds(groups: CellGroup[], holeNumber: number): string[] {
  return groups
    .filter((g) => g.hole_number === holeNumber)
    .flatMap((g) => g.cells.map((c) => `cell_${c.x}_${c.y}`));
}

// 全ホールの登録済みセルマップ（GreenCardGrid用）
function groupsToCellsMap(groups: CellGroup[]): Record<number, string[]> {
  const map: Record<number, string[]> = {};
  groups.forEach((g) => {
    if (!map[g.hole_number]) map[g.hole_number] = [];
    g.cells.forEach((c) => {
      map[g.hole_number].push(`cell_${c.x}_${c.y}`);
    });
  });
  return map;
}

export default function CellsEditPage() {
  const [course, setCourse] = useState<"out" | "in">("out");
  const [selectedHole, setSelectedHole] = useState<number>(1);
  const [cellMode, setCellMode] = useState<CellType>("damage");

  // 登録済みグループ（全ホール分）
  const [damageGroups, setDamageGroups] = useState<CellGroup[]>([]);
  const [banGroups, setBanGroups] = useState<CellGroup[]>([]);
  const [rainGroups, setRainGroups] = useState<CellGroup[]>([]);

  // 新規入力中のセル（ローカルstate、未保存）
  const [newCells, setNewCells] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  // キャンバスサイズ
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(400);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize(Math.floor(Math.min(width, height)));
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // 全グループ取得
  useEffect(() => {
    async function fetchAllGroups() {
      const [damage, ban, rain] = await Promise.all([
        getCellGroups("damage"),
        getCellGroups("ban"),
        getCellGroups("rain"),
      ]);
      setDamageGroups(damage);
      setBanGroups(ban);
      setRainGroups(rain);
    }
    fetchAllGroups();
  }, []);

  // 現在のモードのグループ
  const currentGroups =
    cellMode === "damage"
      ? damageGroups
      : cellMode === "ban"
        ? banGroups
        : rainGroups;

  const setCurrentGroups =
    cellMode === "damage"
      ? setDamageGroups
      : cellMode === "ban"
        ? setBanGroups
        : setRainGroups;

  const damageCellsMap = groupsToCellsMap(damageGroups);
  const banCellsMap = groupsToCellsMap(banGroups);
  const rainCellsMap = groupsToCellsMap(rainGroups);

  // 選択中ホールの登録済みセル
  const registeredCells = groupsToCellIds(currentGroups, selectedHole);

  // GreenCanvasに渡すセル（登録済み + 新規）
  const displayCells = [...registeredCells, ...newCells];

  // セルクリック（ローカルstateのみ更新、APIは叩かない）
  const handleCellClick = (cellId: string) => {
    if (registeredCells.includes(cellId)) return;

    setNewCells((prev) =>
      prev.includes(cellId)
        ? prev.filter((id) => id !== cellId)
        : [...prev, cellId],
    );
  };

  // グループ保存
  const handleSave = async () => {
    if (newCells.length === 0) return;

    setSaving(true);
    try {
      const cells = newCells.map((cellId) => {
        const parts = cellId.split("_");
        return { x: Number(parts[1]), y: Number(parts[2]) };
      });

      const newGroup = await createCellGroup(cellMode, {
        hole_number: selectedHole,
        comment: comment || null,
        cells,
      });

      setCurrentGroups((prev) => [...prev, newGroup]);
      setNewCells([]);
      setComment("");
    } catch (err) {
      console.error("保存エラー:", err);
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  // グループ削除
  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("このグループを削除しますか？")) return;

    try {
      await deleteCellGroup(cellMode, groupId);
      setCurrentGroups((prev) => prev.filter((g) => g.id !== groupId));
    } catch (err) {
      console.error("削除エラー:", err);
      alert("削除に失敗しました");
    }
  };

  // 新規セルクリア
  const handleClear = () => {
    setNewCells([]);
    setComment("");
  };

  // ホール切り替え時に新規セルをリセット
  const handleHoleChange = (holeNumber: number) => {
    setSelectedHole(holeNumber);
    setNewCells([]);
    setComment("");
  };

  // 選択中ホールのグループ一覧
  const holeGroups = currentGroups.filter(
    (g) => g.hole_number === selectedHole,
  );

  return (
    <div className="h-full flex flex-col p-4">
      <PageHeader icon={Grid3x3} title="セル設定" />

      <div className="flex-1 min-h-0 flex gap-4">
        {/* 左: グリッド */}
        <div className="flex-1 min-w-0 bg-card rounded-xl shadow-sm border overflow-hidden flex flex-col">
          {/* セルモード切替（ヘッダー） */}
          <div className="flex-shrink-0 h-[42px] px-3 bg-gradient-to-r from-gray-800 to-gray-900 flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant={cellMode === "damage" ? "default" : "ghost"}
              className={
                cellMode !== "damage"
                  ? "text-white/70 hover:text-white hover:bg-white/20"
                  : ""
              }
              onClick={() => setCellMode("damage")}
            >
              傷み
            </Button>
            <Button
              size="sm"
              variant={cellMode === "ban" ? "default" : "ghost"}
              className={
                cellMode !== "ban"
                  ? "text-white/70 hover:text-white hover:bg-white/20"
                  : ""
              }
              onClick={() => setCellMode("ban")}
            >
              禁止
            </Button>
            <Button
              size="sm"
              variant={cellMode === "rain" ? "default" : "ghost"}
              className={
                cellMode !== "rain"
                  ? "text-white/70 hover:text-white hover:bg-white/20"
                  : ""
              }
              onClick={() => setCellMode("rain")}
            >
              雨天
            </Button>
          </div>

          {/* OUT/IN切り替え */}
          <div className="flex-shrink-0 h-[44px] px-4 bg-muted border-b flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant={course === "out" ? "default" : "outline"}
              onClick={() => {
                setCourse("out");
                handleHoleChange(1);
              }}
            >
              OUT
            </Button>
            <Button
              size="sm"
              variant={course === "in" ? "default" : "outline"}
              onClick={() => {
                setCourse("in");
                handleHoleChange(10);
              }}
            >
              IN
            </Button>
          </div>

          {/* 3×3グリッド */}
          <div className="flex-1 min-h-0 flex items-center justify-center p-2">
            <div
              style={{
                transform: "scale(0.7)",
                transformOrigin: "center center",
              }}
            >
              <GreenCardGrid
                course={course}
                onCardClick={(holeId) => handleHoleChange(Number(holeId))}
                holeDamageCells={
                  cellMode === "damage"
                    ? Object.entries(damageCellsMap).map(([hole, cellIds]) => ({
                        hole: Number(hole),
                        cellIds,
                      }))
                    : []
                }
                holeBanCells={
                  cellMode === "ban"
                    ? Object.entries(banCellsMap).map(([hole, cellIds]) => ({
                        hole: Number(hole),
                        cellIds,
                      }))
                    : []
                }
                holeRainCells={
                  cellMode === "rain"
                    ? Object.entries(rainCellsMap).map(([hole, cellIds]) => ({
                        hole: Number(hole),
                        cellIds,
                      }))
                    : []
                }
              />
            </div>
          </div>
        </div>

        {/* 右: 編集パネル */}
        <div className="flex-1 min-w-0 bg-card rounded-xl shadow-sm border overflow-hidden flex flex-col">
          {/* ヘッダーバー */}
          <div className="flex-shrink-0 h-[42px] px-4 bg-gray-800 flex items-center gap-2">
            <Pencil size={16} className="text-white" />
            <h2 className="text-sm font-bold text-white">
              セル編集 - Hole {selectedHole}
            </h2>
          </div>

          {/* 新規セル情報 + 保存 */}
          <div className="flex-shrink-0 px-4 py-2 bg-muted border-b flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              新規: {newCells.length}セル
            </span>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="コメント（任意）"
              className="flex-1 px-2 py-1 border rounded text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleClear}
              disabled={newCells.length === 0}
            >
              クリア
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || newCells.length === 0}
            >
              <Save size={14} className="mr-1" />
              保存
            </Button>
          </div>

          {/* キャンバス */}
          <div
            ref={canvasContainerRef}
            className="flex-1 min-h-0 flex items-center justify-center p-2 relative"
          >
            {/* 登録済みグループ一覧（上部オーバーレイ） */}
            {holeGroups.length > 0 && (
              <div className="absolute top-0 left-0 right-0 bg-card px-3 py-2 max-h-[150px] overflow-y-auto z-20 shadow-lg border-b">
                <div className="flex flex-wrap gap-2">
                  {holeGroups.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center gap-2 px-2 py-1 rounded border bg-muted text-xs"
                    >
                      <span className="font-medium">
                        {group.cells.length}セル
                      </span>
                      {group.comment && (
                        <span className="text-muted-foreground">
                          {group.comment}
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <GreenCanvas
              hole={String(selectedHole)}
              width={canvasSize}
              height={canvasSize}
              damageCells={
                cellMode === "damage" ? displayCells : registeredCells
              }
              banCells={
                cellMode === "ban"
                  ? displayCells
                  : groupsToCellIds(banGroups, selectedHole)
              }
              rainCells={
                cellMode === "rain"
                  ? displayCells
                  : groupsToCellIds(rainGroups, selectedHole)
              }
              onCellClick={handleCellClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
