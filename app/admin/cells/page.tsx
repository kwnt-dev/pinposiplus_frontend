"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
    // 登録済みセルはクリックで削除しない（グループ単位で削除）
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
    <div>
      <h1>セル編集</h1>
      <div className="flex gap-4">
        {/* 左: グリッド一覧 */}
        <div className="flex-1">
          <div className="p-4">
            <div className="flex justify-center gap-2">
              <Button
                variant={course === "out" ? "default" : "outline"}
                onClick={() => {
                  setCourse("out");
                  handleHoleChange(1);
                }}
              >
                OUT
              </Button>
              <Button
                variant={course === "in" ? "default" : "outline"}
                onClick={() => {
                  setCourse("in");
                  handleHoleChange(10);
                }}
              >
                IN
              </Button>
            </div>
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant={cellMode === "damage" ? "default" : "outline"}
                onClick={() => setCellMode("damage")}
              >
                傷み
              </Button>
              <Button
                variant={cellMode === "ban" ? "default" : "outline"}
                onClick={() => setCellMode("ban")}
              >
                禁止
              </Button>
              <Button
                variant={cellMode === "rain" ? "default" : "outline"}
                onClick={() => setCellMode("rain")}
              >
                雨天
              </Button>
            </div>
            <div
              style={{
                transform: `scale(0.7)`,
                transformOrigin: "top left",
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
        <div className="flex-1">
          <div className="p-4">
            <h2 className="font-bold mb-4">Hole {selectedHole}</h2>

            <GreenCanvas
              hole={String(selectedHole)}
              width={400}
              height={400}
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

            {/* 新規セル・コメント・保存 */}
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600">
                新規: {newCells.length}セル
              </p>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="コメント（任意）: 焼け、虫食い、薬害など"
                className="w-full px-3 py-2 border rounded text-sm"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving || newCells.length === 0}
                >
                  保存
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClear}
                  disabled={newCells.length === 0}
                >
                  クリア
                </Button>
              </div>
            </div>

            {/* 登録済みグループ一覧 */}
            {holeGroups.length > 0 && (
              <div className="mt-6">
                <h3 className="font-bold text-sm mb-2">
                  登録済み ({holeGroups.length}件)
                </h3>
                <div className="space-y-2">
                  {holeGroups.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-2 rounded border bg-gray-50 text-sm"
                    >
                      <div>
                        <span className="font-medium">
                          {group.cells.length}セル
                        </span>
                        {group.comment && (
                          <span className="ml-2 text-gray-500">
                            {group.comment}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteGroup(group.id)}
                      >
                        削除
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
