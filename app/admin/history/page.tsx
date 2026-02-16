"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";

type DateGroup = {
  date: string;
  eventName: string | null;
  groupCount: number | null;
  outSubmitter: string | null;
  inSubmitter: string | null;
};

const mockData: DateGroup[] = [
  {
    date: "2026-02-15",
    eventName: "月例杯",
    groupCount: 42,
    outSubmitter: "田中",
    inSubmitter: "上田",
  },
  {
    date: "2026-02-10",
    eventName: null,
    groupCount: 38,
    outSubmitter: "田中",
    inSubmitter: "中村",
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
  const [histories] = useState<DateGroup[]>(mockData);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filtered = histories.filter((h) => h.date.includes(searchTerm));
  const sorted = [...filtered].sort((a, b) =>
    sortOrder === "desc"
      ? b.date.localeCompare(a.date)
      : a.date.localeCompare(b.date),
  );

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">ピン履歴</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="日付を検索"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-40"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
            }
          >
            {sortOrder === "desc" ? "新しい順" : "古い順"}
          </Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>日付</TableHead>
            <TableHead>イベント</TableHead>
            <TableHead>組数</TableHead>
            <TableHead>作成者</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                履歴がありません
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((h) => (
              <TableRow key={h.date}>
                <TableCell>{h.date}</TableCell>
                <TableCell>{h.eventName ?? "-"}</TableCell>
                <TableCell>
                  {h.groupCount ? `${h.groupCount}組` : "-"}
                </TableCell>
                <TableCell>
                  <div>OUT : {h.outSubmitter ?? "-"}</div>
                  <div>IN : {h.inSubmitter ?? "-"}</div>
                </TableCell>
                <TableCell>PDF</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
