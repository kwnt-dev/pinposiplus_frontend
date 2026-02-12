import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { Input } from "@/components/ui/input";

export default function LoginPage() {
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
          <form className="space-y-4">
            <div>
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">パスワード</Label>

              <Input
                id="password"
                type="password"
                placeholder="••••••••"
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
