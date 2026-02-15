"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
  createdAt: string;
};

const mockUsers: User[] = [
  {
    id: "1",
    name: "田中太郎",
    email: "tanaka@example.com",
    role: "admin",
    createdAt: "2026-01-01",
  },
  {
    id: "2",
    name: "佐藤花子",
    email: "sato@example.com",
    role: "staff",
    createdAt: "2026-01-15",
  },
  {
    id: "3",
    name: "鈴木一郎",
    email: "suzuki@example.com",
    role: "staff",
    createdAt: "2026-02-01",
  },
];

export default function UsersPage() {
  const [users] = useState<User[]>(mockUsers);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">ユーザー管理</h1>
        <Button>新規追加</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>表示名</TableHead>
            <TableHead>メール</TableHead>
            <TableHead>権限</TableHead>
            <TableHead>登録日</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                {user.role === "admin" ? "管理者" : "スタッフ"}
              </TableCell>
              <TableCell>{user.createdAt}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm">
                  編集
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
