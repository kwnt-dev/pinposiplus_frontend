"use client";

import { useRouter } from "next/navigation";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { ShieldCheck, Eye, Send, ClipboardList } from "lucide-react";
import CourseGridPanel from "@/components/admin/CourseGridPanel";
import AutoSuggestPanel from "@/components/admin/AutoSuggestPanel";
import PinEditPanel from "@/components/admin/PinEditPanel";
import { publishSession, PinSession } from "@/lib/pinSession";
import { HelpButton } from "@/components/ui/HelpButton";
import { toast } from "sonner";

function StatusBadge({ session }: { session: PinSession | null }) {
  if (!session) {
    return (
      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
        未作成
      </span>
    );
  }

  switch (session.status) {
    case "draft":
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
          作成中
        </span>
      );
    case "published":
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
          <Eye size={12} /> スタッフ公開中
        </span>
      );
    case "confirmed":
      return (
        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
          <ClipboardList size={12} /> スタッフ確認済み
        </span>
      );
    case "sent":
      return (
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
          <Send size={12} /> 送信済み
        </span>
      );
    default:
      return null;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const {
    course,
    setCourse,
    selectedDate,
    setSelectedDate,
    isRainyDay,
    setIsRainyDay,
    courseDifficulty,
    setCourseDifficulty,
    coursePins,
    rightPanelMode,
    editingHole,
    editingPin,
    outSession,
    inSession,
    damageCellsMap,
    banCellsMap,
    rainCellsMap,
    pastPinsMap,
    reloadSessions,
    handleCourseGenerate,
    handleHoleChange,
    handlePinSave,
    handlePinPlaced,
  } = useAdminDashboard();

  return (
    <div className="h-full flex flex-col p-4">
      <PageHeader icon={ShieldCheck} title="ダッシュボード">
        <StatusBadge session={course === "out" ? outSession : inSession} />
        <Button
          size="sm"
          className="bg-green-500 text-white hover:bg-green-600"
          disabled={
            !outSession ||
            !inSession ||
            outSession.status !== "draft" ||
            inSession.status !== "draft"
          }
          onClick={async () => {
            if (!outSession || !inSession) return;
            try {
              await publishSession(outSession.id);
              await publishSession(inSession.id);
              await reloadSessions();
              toast.success("スタッフに公開しました");
            } catch (err) {
              console.error("公開エラー:", err);
              toast.error("公開に失敗しました");
            }
          }}
        >
          <Eye size={14} className="mr-1" />
          スタッフに公開
        </Button>
        <Button
          size="sm"
          className="bg-blue-500 text-white hover:bg-blue-600"
          disabled={
            !outSession ||
            !inSession ||
            outSession.status !== "confirmed" ||
            inSession.status !== "confirmed"
          }
          onClick={() => {
            router.push(`/admin/pdf-preview?send=true&date=${selectedDate}`);
          }}
        >
          <Send size={14} className="mr-1" />
          マスター室に送信
        </Button>
        <HelpButton title="ダッシュボードの使い方">
          <p>日付を選択し、自動提案を生成してピン位置を決定します。</p>
          <p>1. 右パネルで日付・条件を設定して「自動提案生成」を押す</p>
          <p>2. 3×3グリッドでピン位置を確認・編集</p>
          <p>3. 「スタッフに公開」でスタッフが現場確認</p>
          <p>4. スタッフ確認後「マスター室に送信」でPDF送信</p>
        </HelpButton>
      </PageHeader>

      <div className="flex-1 min-h-0 flex gap-4">
        <CourseGridPanel
          course={course}
          onCourseChange={setCourse}
          pins={coursePins}
          onCardClick={(holeId) => {
            const isSent =
              outSession?.status === "sent" || inSession?.status === "sent";
            if (isSent) return;
            handleHoleChange(Number(holeId));
          }}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
        {rightPanelMode === "auto-suggest" ? (
          <AutoSuggestPanel
            selectedDate={new Date(selectedDate + "T00:00:00")}
            onDateChange={(date) => setSelectedDate(format(date, "yyyy-MM-dd"))}
            isRainyDay={isRainyDay}
            onRainyDayChange={setIsRainyDay}
            courseDifficulty={courseDifficulty}
            onDifficultyChange={setCourseDifficulty}
            onGenerate={handleCourseGenerate}
            disabled={
              outSession?.status === "sent" || inSession?.status === "sent"
            }
          />
        ) : (
          <PinEditPanel
            editingHole={editingHole}
            editingPin={editingPin}
            damageCells={damageCellsMap[editingHole] || []}
            banCells={banCellsMap[editingHole] || []}
            rainCells={rainCellsMap[editingHole] || []}
            pastPins={pastPinsMap[editingHole] || []}
            readOnly={
              outSession?.status === "sent" || inSession?.status === "sent"
            }
            onPinPlaced={handlePinPlaced}
            onPinSave={handlePinSave}
            isRainyDay={isRainyDay}
          />
        )}
      </div>
    </div>
  );
}
