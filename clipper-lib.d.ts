declare module "clipper-lib" {
  export interface IntPoint {
    X: number;
    Y: number;
  }

  export enum JoinType {
    jtSquare = 0,
    jtRound = 1,
    jtMiter = 2,
  }

  export enum EndType {
    etClosedPolygon = 0,
    etClosedLine = 1,
    etOpenButt = 2,
    etOpenSquare = 3,
    etOpenRound = 4,
  }

  export class ClipperOffset {
    constructor();
    AddPath(path: IntPoint[], joinType: JoinType, endType: EndType): void;
    Execute(solution: IntPoint[][], delta: number): void;
    Clear(): void;
  }

  export class Clipper {
    static PointInPolygon(pt: IntPoint, path: IntPoint[]): number;
  }
}
