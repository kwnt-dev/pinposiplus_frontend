import axios from "@/lib/axios";

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

export async function getAutoSuggestData(): Promise<AutoSuggestData> {
  const res = await axios.get("/api/auto-suggest-data");
  return res.data;
}
