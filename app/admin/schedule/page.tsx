"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});

const mockEvents = [
  { title: "月例杯 42組", date: "2026-02-20" },
  { title: "38組", date: "2026-02-25" },
  { title: "クラブ選手権 45組", date: "2026-03-01" },
];

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [eventName, setEventName] = useState("");
  const [groupCount, setGroupCount] = useState("");

  function handleSave() {
    console.log({ date: selectedDate, eventName, groupCount });
    setSelectedDate(null);
    setEventName("");
    setGroupCount("");
  }

  return (
    <div className="p-4">
      <h1>予定表</h1>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="ja"
        events={mockEvents}
        dateClick={(info) => setSelectedDate(info.dateStr)}
      />

      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDate}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>イベント名</Label>
              <Input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
            </div>
            <div>
              <Label>組数</Label>
              <Input
                type="number"
                value={groupCount}
                onChange={(e) => setGroupCount(e.target.value)}
              />
            </div>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
