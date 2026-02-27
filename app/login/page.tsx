"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { Input } from "@/components/ui/input";
import api from "@/lib/axios";
import { GolfIcon } from "@/components/ui/GolfIcon";
import { RotateCcw } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [error, setError] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  async function handleDemoReset() {
    if (resetting) return;

    const confirmed = window.confirm(
      "デモデータをリセットしますか？\n全てのデータが初期状態に戻ります。",
    );
    if (!confirmed) return;

    setResetting(true);
    setResetMessage("");
    setError("");

    try {
      const result = await api.post("/api/demo-reset");
      if (result.data.success) {
        setResetMessage("✅ デモデータをリセットしました");
      } else {
        setError("リセットに失敗しました");
      }
    } catch (err) {
      console.error("リセットエラー:", err);
      setError("リセットに失敗しました");
    } finally {
      setResetting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/api/login", { email, password });

      localStorage.setItem("token", response.data.token);

      if (response.data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/staff");
      }
    } catch (err) {
      setError("メールアドレスまたはパスワードが正しくありません");
    }
  }
  return (
    <div className="min-h-screen bg-page-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <GolfIcon size={48} />
          </div>
          <CardTitle className="text-2xl font-bold text-center mb-1">
            ピンポジ+
          </CardTitle>
          <CardDescription className="text-center">
            ゴルフコース管理システム
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {resetMessage && (
              <p className="text-green-700 text-sm">{resetMessage}</p>
            )}
            <div>
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">パスワード</Label>

              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              className="w-full py-3 rounded-lg font-bold text-base transition-all"
              type="submit"
            >
              ログイン
            </Button>
          </form>
        </CardContent>
        <div className="px-6 pb-6">
          <div className="p-3 bg-amber-50 border-2 border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700 mb-2">
              ※デモ環境のため、データが変更されている可能性があります。
              <br />
              ご使用前にリセットボタンを押してください。
            </p>
            <button
              onClick={handleDemoReset}
              disabled={resetting}
              className={`w-full py-1.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                resetting
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-amber-500 text-white hover:bg-amber-600"
              }`}
            >
              <RotateCcw
                size={14}
                className={resetting ? "animate-spin" : ""}
              />
              デモデータをリセット
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
