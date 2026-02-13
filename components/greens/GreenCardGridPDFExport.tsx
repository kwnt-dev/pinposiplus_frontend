"use client";

import GreenCardPDFExport from "@/components/greens/GreenCardPDFExport";
import { Pin, HolePin } from "@/lib/greenCanvas.geometry";

interface Props {
  course: "out" | "in";
  pins?: HolePin[];
  cardSize?: number;
}

function getDateString(): { dateStr: string; dayStr: string } {
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const dayStr = days[today.getDay()];
  return { dateStr, dayStr };
}

export default function GreenCardGridPDFExport({
  course,
  pins,
  cardSize = 240,
}: Props) {
  const holes =
    course === "out"
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9]
      : [10, 11, 12, 13, 14, 15, 16, 17, 18];

  const { dateStr, dayStr } = getDateString();
  const headerText = course === "out" ? "OUT" : " IN";

  return (
    <div
      style={{
        display: "inline-block",
        gridTemplateColumns: `repeat(3, ${cardSize}px)`,
        outline: "1.5px solid #000000",
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          height: 40,
          backgroundColor: "#000000",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          fontWeight: "bold",
          fontSize: 27,
        }}
      >
        <span>{headerText}</span>
        <span>
          {dateStr}（{dayStr}）
        </span>
      </div>

      {/* 3×3 グリッド */}
      <div
        style={{
          display: "inline-grid",
          gridTemplateColumns: `repeat(3, ${cardSize}px)`,
        }}
      >
        {holes.map((hole) => {
          const pin = pins?.find((p) => p.hole === hole);
          const currentPin: Pin | undefined = pin
            ? { id: `pin-${hole}`, x: pin.x, y: pin.y }
            : undefined;

          return (
            <div key={hole}>
              <GreenCardPDFExport
                hole={String(hole)}
                width={cardSize}
                height={cardSize}
                currentPin={currentPin}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
