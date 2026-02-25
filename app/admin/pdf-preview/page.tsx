"use client";

import { useRef, useEffect, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import GreenCardGridPDFExport from "@/components/greens/GreenCardGridPDFExport";
import { HolePin } from "@/lib/greenCanvas.geometry";
import PDFDocument from "@/components/pdf/PDFDocument";
import { getPinSessions } from "@/lib/pinSession";
import api from "@/lib/axios";

const CARD_SIZE = 240;

/**
 * Konvaグリッドを1枚の画像にまとめる
 *
 * Konvaは1ホールにつき1つのStageコンテナ(.konvajs-content)を生成する
 * 各Stageには描画用・枠線用など複数のcanvasがある
 * これらを3×3に並べて1枚の画像にする
 */
async function exportGridToImage(
  gridRef: React.RefObject<HTMLDivElement | null>,
): Promise<string> {
  const el = gridRef.current;
  if (!el) return "";

  // グリッド構成
  const cols = 3;
  const rows = 3;
  const headerHeight = 40;
  const offset = 2; // strokeRectの線幅が端で切れるのを防ぐ

  // キャンバスサイズ計算
  const gridW = CARD_SIZE * cols;
  const gridH = CARD_SIZE * rows;
  const totalW = gridW + offset * 2;
  const totalH = headerHeight + gridH + offset * 2;

  // PDF印刷用に4倍解像度でcanvasを作成
  const canvas = document.createElement("canvas");
  const scale = 4;
  canvas.width = totalW * scale;
  canvas.height = totalH * scale;

  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale); // 座標系はtotalW x totalHのまま使える

  // canvasはデフォルト透明なので白で塗りつぶす
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, totalW, totalH);

  // ヘッダー背景
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(offset, offset, gridW, headerHeight);

  // ヘッダー枠線
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.strokeRect(offset, offset, gridW, headerHeight);

  // ヘッダーテキスト（DOMから取得）
  const headerEl = el.querySelector("div > div") as HTMLElement;
  if (headerEl) {
    const spans = headerEl.querySelectorAll("span");
    ctx.fillStyle = "white";
    ctx.font = "bold 20px sans-serif";
    ctx.textBaseline = "middle";

    // 左：OUT or IN
    ctx.textAlign = "left";
    ctx.fillText(
      spans[0]?.textContent ?? "",
      offset + 12,
      offset + headerHeight / 2,
    );

    // 右：日付
    ctx.textAlign = "right";
    ctx.fillText(
      spans[1]?.textContent ?? "",
      offset + gridW - 12,
      offset + headerHeight / 2,
    );
  }

  // --- 9ホール分のKonva canvasを3×3に並べる ---
  // KonvaがDOM上に生成したStageコンテナを全て取得（9個）
  const stageList = el.querySelectorAll(".konvajs-content");

  for (let i = 0; i < stageList.length; i++) {
    // i番目のカードの配置先を計算
    // 例: i=0→(0,0)左上, i=1→(1,0)上段中央, i=4→(1,1)中段中央, i=8→(2,2)右下
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = offset + col * CARD_SIZE;
    const y = offset + headerHeight + row * CARD_SIZE;

    // Konvaは1つのStageに複数のcanvasを持つ（描画用、枠線用など）
    // 全部同じ位置に重ねて描画する
    const layerCanvases = stageList[i].querySelectorAll("canvas");
    for (let j = 0; j < layerCanvases.length; j++) {
      ctx.drawImage(layerCanvases[j], x, y, CARD_SIZE, CARD_SIZE);
    }
  }

  // グリッド部分の外枠
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.strokeRect(offset, offset + headerHeight, gridW, gridH);

  return canvas.toDataURL("image/png", 1.0);
}

/**
 * OUT/INグリッドを画像化してPDFを生成・ダウンロードする
 */
async function handleDownloadPDF(
  outRef: React.RefObject<HTMLDivElement | null>,
  inRef: React.RefObject<HTMLDivElement | null>,
) {
  // Konvaの描画完了を待つ
  await new Promise((r) => setTimeout(r, 500));

  const outImage = await exportGridToImage(outRef);
  const inImage = await exportGridToImage(inRef);

  if (!outImage || !inImage) {
    alert("画像の生成に失敗しました");
    return;
  }

  // react-pdfでPDF生成
  const pdfData = await pdf(
    <PDFDocument outImageUrl={outImage} inImageUrl={inImage} />,
  ).toBlob();

  // PDFファイルをダウンロード
  // ダウンロード用のaタグを作ってクリックする（JSからファイルを保存する定番の方法）
  const downloadUrl = URL.createObjectURL(pdfData);
  const link = document.createElement("a");
  link.href = downloadUrl;

  // ファイル名: ピンポジション_20260210.pdf
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  link.download = `ピンポジション_${year}${month}${day}.pdf`;

  link.click();
  URL.revokeObjectURL(downloadUrl);
}

export default function PDFPreviewPage() {
  const outRef = useRef<HTMLDivElement>(null);
  const inRef = useRef<HTMLDivElement>(null);
  const [pins, setPins] = useState<HolePin[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const sessions = await getPinSessions();
        const allPins: HolePin[] = [];
        for (const s of sessions) {
          const res = await api.get(`/api/pin-sessions/${s.id}`);
          const sessionPins =
            res.data.pins?.map(
              (p: { hole_number: number; x: number; y: number }) => ({
                hole: p.hole_number,
                x: p.x,
                y: p.y,
              }),
            ) || [];
          allPins.push(...sessionPins);
        }
        setPins(allPins);
      } catch (err) {
        console.error("ピン取得エラー:", err);
      }
    };
    load();
  }, []);

  return (
    <div className="p-8">
      <div className="mb-6">
        <button onClick={() => handleDownloadPDF(outRef, inRef)}>
          PDFダウンロード
        </button>
      </div>

      <div className="mb-4">
        <div ref={outRef}>
          <GreenCardGridPDFExport
            course="out"
            pins={pins}
            cardSize={CARD_SIZE}
          />
        </div>
      </div>

      <div>
        <div ref={inRef}>
          <GreenCardGridPDFExport
            course="in"
            pins={pins}
            cardSize={CARD_SIZE}
          />
        </div>
      </div>
    </div>
  );
}
