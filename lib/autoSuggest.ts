import axios from "@/lib/axios";

/** 自動提案に必要なデータの型（セル情報・過去ピン） */
export interface AutoSuggestData {
  damage_cells: Record<
    string,
    { id: string; hole_number: number; x: number; y: number }[]
  >;
  ban_cells: Record<
    string,
    { id: string; hole_number: number; x: number; y: number }[]
  >;
  rain_cells: Record<
    string,
    { id: string; hole_number: number; x: number; y: number }[]
  >;
  past_pins: Record<
    string,
    { id: string; hole_number: number; x: number; y: number; date: string }[]
  >;
}

/** 自動提案用のセル・過去ピンデータを一括取得 */
export async function getAutoSuggestData(): Promise<AutoSuggestData> {
  const res = await axios.get("/api/auto-suggest-data");
  return res.data;
}
