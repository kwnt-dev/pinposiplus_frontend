"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function StaffPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-bold">コース選択</h1>
      <div className="flex gap-4">
        <Button onClick={() => router.push("/staff/out")}>OUT</Button>
        <Button onClick={() => router.push("/staff/in")}>IN</Button>
      </div>
    </div>
  );
}
