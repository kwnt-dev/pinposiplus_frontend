// ホール設定（v1から移植）

export interface HoleConfig {
  exit: { x: number; y: number };
  centerLineMarks: {
    front: { x: number; y: number };
    back: { x: number; y: number };
  };
  isShortHole: boolean;
}

export const HOLE_CONFIGS: Record<string, HoleConfig> = {
  "01": {
    exit: { x: 10, y: 16 },
    centerLineMarks: { front: { x: 30, y: 57 }, back: { x: 30, y: 17 } },
    isShortHole: false,
  },
  "02": {
    exit: { x: 50, y: 15 },
    centerLineMarks: { front: { x: 30, y: 57 }, back: { x: 30, y: 17 } },
    isShortHole: true,
  },
  "03": {
    exit: { x: 53, y: 13 },
    centerLineMarks: { front: { x: 30, y: 57 }, back: { x: 30, y: 15 } },
    isShortHole: false,
  },
  "04": {
    exit: { x: 10, y: 10 },
    centerLineMarks: { front: { x: 30, y: 57 }, back: { x: 30, y: 10 } },
    isShortHole: false,
  },
  "05": {
    exit: { x: 55, y: 34 },
    centerLineMarks: { front: { x: 30, y: 58 }, back: { x: 30, y: 17 } },
    isShortHole: false,
  },
  "06": {
    exit: { x: 50, y: 17 },
    centerLineMarks: { front: { x: 30, y: 58 }, back: { x: 30, y: 11 } },
    isShortHole: false,
  },
  "07": {
    exit: { x: 13, y: 15 },
    centerLineMarks: { front: { x: 30, y: 57 }, back: { x: 30, y: 15 } },
    isShortHole: true,
  },
  "08": {
    exit: { x: 5, y: 20 },
    centerLineMarks: { front: { x: 30, y: 57 }, back: { x: 30, y: 21 } },
    isShortHole: false,
  },
  "09": {
    exit: { x: 5, y: 10 },
    centerLineMarks: { front: { x: 30, y: 57 }, back: { x: 30, y: 12 } },
    isShortHole: false,
  },
  "10": {
    exit: { x: 31, y: 13 },
    centerLineMarks: { front: { x: 30, y: 57 }, back: { x: 30, y: 18 } },
    isShortHole: false,
  },
  "11": {
    exit: { x: 50, y: 13 },
    centerLineMarks: { front: { x: 30, y: 56 }, back: { x: 30, y: 13 } },
    isShortHole: false,
  },
  "12": {
    exit: { x: 5, y: 20 },
    centerLineMarks: { front: { x: 30, y: 58 }, back: { x: 30, y: 12 } },
    isShortHole: true,
  },
  "13": {
    exit: { x: 53, y: 5 },
    centerLineMarks: { front: { x: 30, y: 57 }, back: { x: 30, y: 6 } },
    isShortHole: false,
  },
  "14": {
    exit: { x: 5, y: 30 },
    centerLineMarks: { front: { x: 30, y: 57 }, back: { x: 30, y: 19 } },
    isShortHole: false,
  },
  "15": {
    exit: { x: 55, y: 33 },
    centerLineMarks: { front: { x: 30, y: 57 }, back: { x: 30, y: 15 } },
    isShortHole: false,
  },
  "16": {
    exit: { x: 55, y: 53 },
    centerLineMarks: { front: { x: 30, y: 57 }, back: { x: 30, y: 24 } },
    isShortHole: true,
  },
  "17": {
    exit: { x: 55, y: 15 },
    centerLineMarks: { front: { x: 30, y: 57 }, back: { x: 30, y: 19 } },
    isShortHole: false,
  },
  "18": {
    exit: { x: 55, y: 10 },
    centerLineMarks: { front: { x: 30, y: 57 }, back: { x: 30, y: 15 } },
    isShortHole: false,
  },
};
