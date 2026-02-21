import api from "@/lib/axios";

// セルグループ型定義
export interface CellGroup {
  id: string;
  hole_number: number;
  comment: string | null;
  created_at: string;
  cells: { id: string; x: number; y: number }[];
}

type CellType = "damage" | "ban" | "rain";

function getEndpoint(type: CellType): string {
  return `${type}-cell-groups`;
}

// グループ一覧取得（ホール番号でフィルタ可能）
export async function getCellGroups(
  type: CellType,
  holeNumber?: number,
): Promise<CellGroup[]> {
  const endpoint = getEndpoint(type);
  const params = holeNumber ? `?hole_number=${holeNumber}` : "";
  const res = await api.get(`/api/${endpoint}${params}`);
  return res.data;
}

// グループ作成（セル配列ごと一括保存）
export async function createCellGroup(
  type: CellType,
  data: {
    hole_number: number;
    comment?: string | null;
    cells: { x: number; y: number }[];
  },
): Promise<CellGroup> {
  const endpoint = getEndpoint(type);
  const res = await api.post(`/api/${endpoint}`, data);
  return res.data;
}

// グループ削除（子セルも連鎖削除）
export async function deleteCellGroup(
  type: CellType,
  groupId: string,
): Promise<void> {
  const endpoint = getEndpoint(type);
  await api.delete(`/api/${endpoint}/${groupId}`);
}
