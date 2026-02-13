"use client";

import { useState } from "react";
import GreenCardGridPDF from "@/components/greens/GreenCardGridPDF";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";

export default function DashboardPage() {
  const [course, setCourse] = useState<"out" | "in">("out");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isRainyDay, setIsRainyDay] = useState(false);

  return (
    <div>
      <h1>ダッシュボード</h1>
      <div className="flex gap-4">
        <div className="flex-1">
          {/* 左パネル */}
          <div className="flex justify-center gap-2">
            {" "}
            <Button
              variant={course === "out" ? "default" : "outline"}
              onClick={() => setCourse("out")}
            >
              OUT
            </Button>
            <Button
              variant={course === "in" ? "default" : "outline"}
              onClick={() => setCourse("in")}
            >
              IN
            </Button>
          </div>
          <div
            style={{
              transform: `scale(0.7)`,
              transformOrigin: "top left",
            }}
          >
            <GreenCardGridPDF course={course} />
          </div>
        </div>
        <div className="flex-1">
          {/* 右パネル　*/}
          <div>
            <Label>日付</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full mt-1">
                  {format(selectedDate, "yyyy-MM-dd")}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Switch checked={isRainyDay} onCheckedChange={setIsRainyDay} />
            <Label>雨天モード</Label>
          </div>
        </div>
      </div>
    </div>
  );
}
