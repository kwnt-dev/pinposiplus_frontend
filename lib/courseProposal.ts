import { Candidate } from "./autoProposal";

// 型定義

export type CourseDifficulty = "easy" | "medium" | "hard";

export interface HoleCandidates {
  holeNumber: number;
  candidates: Candidate[];
  isPar3: boolean;
}

export interface CourseProposalInput {
  holes: HoleCandidates[];
  courseDifficulty: CourseDifficulty;
}
