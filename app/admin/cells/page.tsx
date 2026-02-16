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
  const [damageCellIdMap, setDamageCellIdMap] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    async function fetchAllCells() {
      const holes = Array.from({ length: 18 }, (_, i) => i + 1);

      const damageResults = await Promise.all(
        holes.map((h) => api.get(`/api/damage-cells?hole_number=${h}`)),
      );

      const damageMap: Record<number, string[]> = {};
      const damageIds: Record<string, string> = {};

      holes.forEach((h, i) => {
        damageMap[h] = damageResults[i].data.map(
          (c: { x: number; y: number }) => `cell_${c.x}_${c.y}`,
        );
        damageResults[i].data.forEach(
          (c: { id: string; x: number; y: number }) => {
            damageIds[`${h}_cell_${c.x}_${c.y}`] = c.id;
          },
        );
      });

      setDamageCellsMap(damageMap);
      setDamageCellIdMap(damageIds);
    }

    fetchAllCells();
  }, []);

  const handleCellClick = async (cellId: string) => {
    if (cellMode !== "damage") return;

    const parts = cellId.split("_");
    const x = Number(parts[1]);
    const y = Number(parts[2]);
    const currentCells = damageCellsMap[selectedHole] || [];
    const isAlreadySelected = currentCells.includes(cellId);
    const key = `${selectedHole}_${cellId}`;

    if (isAlreadySelected) {
      const dbId = damageCellIdMap[key];
      if (dbId) {
        await api.delete(`/api/damage-cells/${dbId}`);
        setDamageCellIdMap((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
      setDamageCellsMap((prev) => ({
        ...prev,
        [selectedHole]: currentCells.filter((id) => id !== cellId),
      }));
    } else {
      const response = await api.post("/api/damage-cells", {
        hole_number: selectedHole,
        x,
        y,
      });
      setDamageCellIdMap((prev) => ({ ...prev, [key]: response.data.id }));
      setDamageCellsMap((prev) => ({
        ...prev,
        [selectedHole]: [...currentCells, cellId],
      }));
    }
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
