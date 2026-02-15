"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PinHistory = {
  date: string;
  eventName: string | null;
  groupCount: number | null;
  outSubmitter: string | null;
  inSubmitter: string | null;
};

const mockData: PinHistory[] = [
  {
    date: "2026-02-15",
    eventName: "月例杯",
    groupCount: 42,
    outSubmitter: "田中",
    inSubmitter: "佐藤",
  },
  {
    date: "2026-02-10",
    eventName: null,
    groupCount: 38,
    outSubmitter: "田中",
    inSubmitter: null,
  },
  {
    date: "2026-02-05",
    eventName: "クラブ選手権",
    groupCount: 45,
    outSubmitter: "佐藤",
    inSubmitter: "田中",
  },
];

export default function HistoryPage() {
  const [histories] = useState<PinHistory[]>(mockData);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">ピン履歴</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>日付</TableHead>
            <TableHead>イベント</TableHead>
            <TableHead>組数</TableHead>
            <TableHead>作成者</TableHead>
            <TableHead>PDF</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {histories.map((h) => (
            <TableRow key={h.date}>
              <TableCell>{h.date}</TableCell>
              <TableCell>{h.eventName ?? "-"}</TableCell>
              <TableCell>{h.groupCount ? `${h.groupCount}組` : "-"}</TableCell>
              <TableCell>
                <div>OUT: {h.outSubmitter ?? "-"}</div>
                <div>IN: {h.inSubmitter ?? "-"}</div>
              </TableCell>
              <TableCell>PDF</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
