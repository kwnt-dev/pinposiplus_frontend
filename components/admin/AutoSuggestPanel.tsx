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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CourseDifficulty } from "@/lib/courseProposal";
import { Target } from "lucide-react";

interface AutoSuggestPanelProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  isRainyDay: boolean;
  onRainyDayChange: (value: boolean) => void;
  courseDifficulty: CourseDifficulty;
  onDifficultyChange: (value: CourseDifficulty) => void;
  onGenerate: () => void;
}

export default function AutoSuggestPanel({
  selectedDate,
  onDateChange,
  isRainyDay,
  onRainyDayChange,
  courseDifficulty,
  onDifficultyChange,
  onGenerate,
}: AutoSuggestPanelProps) {
  return (
    <div className="flex-1 min-w-0 bg-card rounded-xl shadow-sm border overflow-hidden flex flex-col">
      {/* ヘッダーバー */}
      <div className="flex-shrink-0 h-[42px] px-4 bg-green-600 flex items-center gap-2">
        <Target size={16} className="text-white" />
        <h2 className="text-sm font-bold text-white">自動提案設定</h2>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 p-4 space-y-4">
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
                onSelect={(date) => date && onDateChange(date)}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={isRainyDay} onCheckedChange={onRainyDayChange} />
          <Label>雨天モード</Label>
        </div>
        <div>
          <Label>コース難易度</Label>
          <Select
            value={courseDifficulty}
            onValueChange={(v) => onDifficultyChange(v as CourseDifficulty)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="w-full" onClick={onGenerate}>
          自動提案を実行
        </Button>
      </div>
    </div>
  );
}
