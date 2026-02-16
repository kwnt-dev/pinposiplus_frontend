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

export default function HistoryPage() {
  const [histories, setHistories] = useState<DateGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    Promise.all([
      api.get("/api/pin-histories"),
      api.get("/api/schedules"),
      api.get("/api/users"),
    ]).then(([pinRes, scheduleRes, userRes]) => {
      const pins = pinRes.data;
      const schedules = scheduleRes.data;
      const users = userRes.data;

      // userIdからnameへのマップ
      const userMap: Record<string, string> = {};
      users.forEach((u: { id: string; name: string }) => {
        userMap[u.id] = u.name;
      });

      // scheduleのdateからevent_name/group_countへのマップ
      const scheduleMap: Record<
        string,
        { event_name: string | null; group_count: number | null }
      > = {};
      schedules.forEach(
        (s: {
          date: string;
          event_name: string | null;
          group_count: number | null;
        }) => {
          scheduleMap[s.date] = {
            event_name: s.event_name,
            group_count: s.group_count,
          };
        },
      );

      // pin_historiesを日付でグループ化
      const grouped: Record<
        string,
        { outSubmitter: string | null; inSubmitter: string | null }
      > = {};
      pins.forEach(
        (p: {
          date: string;
          hole_number: number;
          submitted_by: string | null;
        }) => {
          if (!grouped[p.date]) {
            grouped[p.date] = { outSubmitter: null, inSubmitter: null };
          }
          const name = p.submitted_by
            ? (userMap[p.submitted_by] ?? null)
            : null;
          if (p.hole_number <= 9) {
            grouped[p.date].outSubmitter = name;
          } else {
            grouped[p.date].inSubmitter = name;
          }
        },
      );

      const result: DateGroup[] = Object.keys(grouped).map((date) => ({
        date,
        eventName: scheduleMap[date]?.event_name ?? null,
        groupCount: scheduleMap[date]?.group_count ?? null,
        outSubmitter: grouped[date].outSubmitter,
        inSubmitter: grouped[date].inSubmitter,
      }));

      setHistories(result);
    });
  }, []);

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
