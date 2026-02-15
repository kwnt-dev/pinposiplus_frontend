"use client";

import { useRouter } from "next/navigation";
import GreenCardGridPDF from "@/components/greens/GreenCardGridPDF";

export default function StaffInPage() {
  const router = useRouter();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">IN</h1>
      <GreenCardGridPDF
        course="in"
        onCardClick={(holeId) => router.push(`/staff/hole/${holeId}`)}
      />
    </div>
  );
}
