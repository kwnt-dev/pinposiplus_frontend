import api from "@/lib/axios";

// セッション型定義
export interface PinSession {
  id: string;
  course: string;
  status: string;
  target_date: string | null;
  event_name: string | null;
  groups_count: number | null;
  is_rainy: boolean;
  created_by: string | null;
  submitted_by: string | null;
  submitted_by_name: string | null;
  submitted_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  published_at: string | null;
  pdf_url: string | null;
}

// セッション作成（自動提案実行時にOUT/INそれぞれ作成）
export async function createPinSession(data: {
  course: "OUT" | "IN";
  target_date?: string;
  event_name?: string;
  groups_count?: number;
  is_rainy?: boolean;
}): Promise<PinSession> {
  const res = await api.post("/api/pin-sessions", data);
  return res.data;
}

// セッション一覧取得（ステータス・コース・日付でフィルタ可能）
export async function getPinSessions(params?: {
  status?: string | string[];
  course?: string;
  target_date?: string;
}): Promise<PinSession[]> {
  const res = await api.get("/api/pin-sessions", { params });
  return res.data;
}

// スタッフに公開 → published
export async function publishSession(id: string): Promise<PinSession> {
  const res = await api.patch(`/api/pin-sessions/${id}/publish`);
  return res.data;
}

// スタッフが確認提出 → confirmed
export async function confirmSession(id: string): Promise<PinSession> {
  const res = await api.patch(`/api/pin-sessions/${id}/confirm`);
  return res.data;
}

// マスター室に送信 → sent（PDF付き）
export async function sendSession(
  id: string,
  pdfBase64?: string,
): Promise<PinSession> {
  const res = await api.patch(`/api/pin-sessions/${id}/send`, {
    pdf_base64: pdfBase64,
  });
  return res.data;
}
