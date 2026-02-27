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
import { PageHeader } from "@/components/layout/PageHeader";
import { History as HistoryIcon, FileText } from "lucide-react";
type DateGroup = {
  date: string;
  eventName: string | null;
  groupCount: number | null;
  outSubmitter: string | null;
  inSubmitter: string | null;
  pdfUrl: string | null;
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
      api.get("/api/pin-sessions"),
    ]).then(([pinRes, scheduleRes, userRes, sessionRes]) => {
      const pins = pinRes.data;
      const schedules = scheduleRes.data;
      const users = userRes.data;
      const sessions = sessionRes.data;

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

      // dateからpdf_urlへのマップ（sentのセッションからpdf_urlを取得）
      const pdfMap: Record<string, string | null> = {};
      sessions.forEach(
        (s: {
          target_date: string;
          status: string;
          pdf_url: string | null;
        }) => {
          if (s.status === "sent" && s.pdf_url) {
            pdfMap[s.target_date] = s.pdf_url;
          }
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
        pdfUrl: pdfMap[date] ?? null,
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
    <div className="p-4 h-full flex flex-col">
      <PageHeader icon={HistoryIcon} title="ピン履歴" />

      <div className="flex-1 min-h-0 bg-card rounded-xl shadow-sm border overflow-hidden flex flex-col">
        {/* ヘッダーバー: 検索・ソート */}
        <div className="flex-shrink-0 h-[42px] px-4 bg-gray-800 flex items-center">
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Input
              placeholder="日付を検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-40 h-7 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/20"
              onClick={() =>
                setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
              }
            >
              {sortOrder === "desc" ? "新しい順" : "古い順"}
            </Button>
          </div>
        </div>

        {/* テーブル */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="border-r">日付</TableHead>
                <TableHead className="border-r">イベント</TableHead>
                <TableHead className="border-r">組数</TableHead>
                <TableHead className="border-r">作成者</TableHead>
                <TableHead>PDF</TableHead>
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
                  <TableRow key={h.date} className="border-b">
                    <TableCell className="border-r">{h.date}</TableCell>
                    <TableCell className="border-r">
                      {h.eventName ?? "-"}
                    </TableCell>
                    <TableCell className="border-r">
                      {h.groupCount ? `${h.groupCount}組` : "-"}
                    </TableCell>
                    <TableCell className="border-r">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-10 text-center px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                            OUT
                          </span>
                          <span className="text-sm">
                            {h.outSubmitter ?? "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-10 text-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            IN
                          </span>
                          <span className="text-sm">
                            {h.inSubmitter ?? "-"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        className="px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                        onClick={() => {
                          if (h.pdfUrl) window.open(h.pdfUrl, "_blank");
                        }}
                      >
                        <FileText size={14} className="inline mr-1" />
                        PDF
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
