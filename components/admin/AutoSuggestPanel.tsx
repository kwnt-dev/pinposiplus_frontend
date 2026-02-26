import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CourseDifficulty } from "@/lib/courseProposal";
import { Switch } from "@/components/ui/switch";
import { Target, Users, Rocket, ClipboardList, CloudRain } from "lucide-react";
import { fetchWeatherForecast, DailyForecast } from "@/lib/weather";
import api from "@/lib/axios";

interface AutoSuggestPanelProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  isRainyDay: boolean;
  onRainyDayChange: (value: boolean) => void;
  courseDifficulty: CourseDifficulty;
  onDifficultyChange: (value: CourseDifficulty) => void;
  onGenerate: () => void;
  disabled?: boolean;
}

export default function AutoSuggestPanel({
  selectedDate,
  onDateChange,
  isRainyDay: isRainyDayProp,
  onRainyDayChange,
  courseDifficulty,
  onDifficultyChange,
  onGenerate,
  disabled = false,
}: AutoSuggestPanelProps) {
  const [weatherForecasts, setWeatherForecasts] = useState<DailyForecast[]>([]);
  const [schedule, setSchedule] = useState<{
    event_name: string | null;
    group_count: number | null;
  } | null>(null);

  // 天気予報を取得
  useEffect(() => {
    fetchWeatherForecast().then(setWeatherForecasts);
  }, []);

  // 選択日付の予定を取得
  useEffect(() => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    api
      .get(`/api/schedules?start_date=${dateStr}&end_date=${dateStr}`)
      .then((res) => {
        if (res.data.length > 0) {
          setSchedule(res.data[0]);
        } else {
          setSchedule(null);
        }
      })
      .catch(() => setSchedule(null));
  }, [selectedDate]);

  return (
    <div className="flex-1 min-w-0 bg-card rounded-xl shadow-sm border overflow-hidden flex flex-col">
      {/* ヘッダーバー */}
      <div className="flex-shrink-0 h-[42px] px-4 bg-gradient-to-r from-gray-800 to-gray-900 flex items-center gap-2">
        <Target size={16} className="text-white" />
        <h2 className="text-sm font-bold text-white">自動提案設定</h2>
      </div>

      {/* 左のOUT/IN切り替えと同じ高さの帯 */}
      <div className="flex-shrink-0 h-[44px] px-4 bg-muted border-b border-default flex items-center justify-center"></div>

      {/* コンテンツ */}
      <div className="flex-1 p-4 space-y-5">
        {/* 選択日付の表示 */}
        <div className="text-center">
          <div className="text-2xl font-bold">
            {format(selectedDate, "yyyy年M月d日", { locale: ja })}
          </div>
          <div className="text-lg text-blue-500 font-bold">
            （{format(selectedDate, "EEEE", { locale: ja })}）
          </div>
          <div className="mt-1 flex items-center justify-center gap-3 text-base">
            {schedule?.event_name && (
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                {schedule.event_name}
              </span>
            )}
            {schedule?.group_count && (
              <span className="text-green-600 font-bold flex items-center gap-1">
                <Users size={12} /> {schedule.group_count}組
              </span>
            )}
            {!schedule?.event_name && !schedule?.group_count && (
              <span className="text-gray-400 text-xs">予定なし</span>
            )}
          </div>
        </div>

        {/* 日付 */}
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

        {/* 天気予報 */}
        {weatherForecasts.length > 0 && (
          <div>
            <Label>天気予報</Label>
            <div className="grid grid-cols-5 gap-1 text-center mt-1">
              {weatherForecasts.map((weather) => (
                <div key={weather.date} className="text-xs">
                  <div>{weather.date.slice(8)}</div>
                  <div className="text-lg">{weather.emoji}</div>
                  <div>
                    {weather.tempMin}°/{weather.tempMax}°
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 雨天禁止モード */}
        <div className="flex items-center justify-between bg-muted rounded-lg px-3 py-2.5">
          <span
            className={`text-sm font-medium flex items-center gap-1 ${
              isRainyDayProp ? "text-blue-500" : "text-gray-400"
            }`}
          >
            <CloudRain size={14} /> 雨天禁止モード
          </span>
          <Switch
            checked={isRainyDayProp}
            onCheckedChange={onRainyDayChange}
            className="h-6 w-11 [&_span]:size-5 data-[state=checked]:bg-blue-500"
          />
        </div>

        {/* コース難易度 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label>コース難易度</Label>
            <span className="text-xs text-gray-400">
              9ホールごとの割合{" "}
              {courseDifficulty === "easy"
                ? "易4:中3:難2"
                : courseDifficulty === "medium"
                  ? "易3:中3:難3"
                  : "易2:中3:難4"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {(["easy", "medium", "hard"] as const).map((diff) => (
              <Button
                key={diff}
                variant="ghost"
                onClick={() => onDifficultyChange(diff)}
                className={`py-2 rounded-lg font-bold text-sm transition-all ${
                  courseDifficulty === diff
                    ? diff === "easy"
                      ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                      : diff === "medium"
                        ? "bg-yellow-500 text-white hover:bg-yellow-600 hover:text-white"
                        : "bg-red-600 text-white hover:bg-red-700 hover:text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {diff === "easy" ? "易" : diff === "medium" ? "中" : "難"}
              </Button>
            ))}
          </div>
        </div>

        {/* 自動提案実行 */}
        <div className="py-3">
          <Button
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${
              disabled
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
            }`}
            onClick={onGenerate}
            disabled={disabled}
          >
            <Rocket size={16} /> 自動提案生成
          </Button>
        </div>

        {/* ワークフロー説明 */}
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <h3 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-1">
            <ClipboardList size={14} /> ワークフロー
          </h3>
          <ol className="text-xs text-blue-700 space-y-1 pl-4">
            <li className="list-decimal">
              <span className="inline-block w-[8em]">提案作成</span>-
              管理者が日付・条件を設定して一括生成
            </li>
            <li className="list-decimal">
              <span className="inline-block w-[8em]">事前に確認</span>-
              管理者が3×3グリッドでピン位置を確認・編集
            </li>
            <li className="list-decimal">
              <span className="inline-block w-[8em]">スタッフに公開</span>-
              スタッフが現場で確認し編集
            </li>
            <li className="list-decimal">
              <span className="inline-block w-[8em]">最終確認</span>-
              管理者がスタッフの現場確認報告を受けて再調整
            </li>
            <li className="list-decimal">
              <span className="inline-block w-[8em]">提案送信</span>-
              管理者がマスター室へ送信（編集不可）
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
