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
    <div className="p-4">
      <h2 className="font-bold mb-4">自動提案設定</h2>
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
      <div className="flex items-center gap-2 mt-4">
        <Switch checked={isRainyDay} onCheckedChange={onRainyDayChange} />
        <Label>雨天モード</Label>
      </div>
      <div className="mt-4">
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
      <Button className="w-full mt-6" onClick={onGenerate}>
        自動提案を実行
      </Button>
    </div>
  );
}
