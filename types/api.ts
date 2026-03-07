/** ピンのAPIレスポンス型 */
export interface PinResponse {
  id: string;
  hole_number: number;
  x: number;
  y: number;
  session_id?: string;
}
