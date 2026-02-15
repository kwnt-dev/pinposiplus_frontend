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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");

  function openAdd() {
    setEditingUser(null);
    setName("");
    setEmail("");
    setRole("staff");
    setIsOpen(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setIsOpen(true);
  }

  function handleSave() {
    if (!email) return;
    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id ? { ...u, name, email, role } : u,
        ),
      );
    } else {
      setUsers((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          name,
          email,
          role,
          createdAt: new Date().toISOString().split("T")[0],
        },
      ]);
    }
    setIsOpen(false);
  }

  function handleDelete() {
    if (!editingUser) return;
    setUsers((prev) => prev.filter((u) => u.id !== editingUser.id));
    setIsOpen(false);
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">ユーザー管理</h1>
        <Button onClick={openAdd}>新規追加</Button>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(user)}
                >
                  編集
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "ユーザー編集" : "新規追加"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>メール</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>表示名</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>権限</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "staff")}
                className="w-full border rounded-md p-2"
              >
                <option value="staff">スタッフ</option>
                <option value="admin">管理者</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>保存</Button>
              {editingUser && (
                <Button variant="destructive" onClick={handleDelete}>
                  削除
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
