"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await api.get("/sanctum/csrf-cookie");
    await api.post("/api/login", { email, password });
  }

  return (
    <div className="min-h-screen bg-page-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center mb-1">
            ピンポジ+
          </CardTitle>
          <CardDescription className="text-center">
            ゴルフコース管理システム
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
      </Card>
    </div>
  );
}
