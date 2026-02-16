"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import GreenCardGrid from "@/components/greens/GreenCardGrid";
import GreenCanvas from "@/components/greens/GreenCanvas";
import api from "@/lib/axios";

export default function CellsEditPage() {
  const [course, setCourse] = useState<"out" | "in">("out");
  const [selectedHole, setSelectedHole] = useState<number>(1);
  const [cellMode, setCellMode] = useState<"damage" | "ban" | "rain">("damage");
  const [damageCellsMap, setDamageCellsMap] = useState<
    Record<number, string[]>
  >({});
  const [banCellsMap, setBanCellsMap] = useState<Record<number, string[]>>({});
  const [rainCellsMap, setRainCellsMap] = useState<Record<number, string[]>>(
    {},
  );

  // 初回に全ホールのセルデータを取得
  useEffect(() => {
    async function fetchAllCells() {
      const holes = Array.from({ length: 18 }, (_, i) => i + 1);

      const [damageResults, banResults, rainResults] = await Promise.all([
        Promise.all(
          holes.map((h) => api.get(`/api/damage-cells?hole_number=${h}`)),
        ),
        Promise.all(
          holes.map((h) => api.get(`/api/ban-cells?hole_number=${h}`)),
        ),
        Promise.all(
          holes.map((h) => api.get(`/api/rain-cells?hole_number=${h}`)),
        ),
      ]);

      const toCellIds = (data: { x: number; y: number }[]) =>
        data.map((c) => `cell_${c.x}_${c.y}`);

      const damageMap: Record<number, string[]> = {};
      const banMap: Record<number, string[]> = {};
      const rainMap: Record<number, string[]> = {};

      holes.forEach((h, i) => {
        damageMap[h] = toCellIds(damageResults[i].data);
        banMap[h] = toCellIds(banResults[i].data);
        rainMap[h] = toCellIds(rainResults[i].data);
      });

      setDamageCellsMap(damageMap);
      setBanCellsMap(banMap);
      setRainCellsMap(rainMap);
    }

    fetchAllCells();
  }, []);

  const handleCellClick = (cellId: string) => {
    const updateCells =
      cellMode === "damage"
        ? setDamageCellsMap
        : cellMode === "ban"
          ? setBanCellsMap
          : setRainCellsMap;

    updateCells((prev) => {
      const currentCells = prev[selectedHole] || [];
      const isAlreadySelected = currentCells.includes(cellId);
      return {
        ...prev,
        [selectedHole]: isAlreadySelected
          ? currentCells.filter((id) => id !== cellId)
          : [...currentCells, cellId],
      };
    });
  };

  return (
    <div>
      <h1>セル編集</h1>
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="p-4">
            <div className="flex justify-center gap-2">
              <Button
                variant={course === "out" ? "default" : "outline"}
                onClick={() => {
                  setCourse("out");
                  setSelectedHole(1);
                }}
              >
                OUT
              </Button>
              <Button
                variant={course === "in" ? "default" : "outline"}
                onClick={() => {
                  setCourse("in");
                  setSelectedHole(10);
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
                onCardClick={(holeId) => setSelectedHole(Number(holeId))}
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
        <div className="flex-1">
          <div className="p-4">
            <h2 className="font-bold mb-4">Hole {selectedHole}</h2>
            <GreenCanvas
              hole={String(selectedHole)}
              width={400}
              height={400}
              damageCells={
                cellMode === "damage" ? damageCellsMap[selectedHole] || [] : []
              }
              banCells={
                cellMode === "ban" ? banCellsMap[selectedHole] || [] : []
              }
              rainCells={
                cellMode === "rain" ? rainCellsMap[selectedHole] || [] : []
              }
              onCellClick={handleCellClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
