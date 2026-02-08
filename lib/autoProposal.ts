import { Cell, Pin, HoleData } from "@/components/greens/GreenCanvas";

// 型定義

export interface AutoProposalInput {
  holeData: HoleData;
  exit: { x: number; y: number };
  damageCells: string[];
  banCells: string[];
  rainCells: string[];
  pastPins: Pin[];
  isRainyDay: boolean;
}
