"use client";

import { useState, useEffect } from "react";
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
import api from "@/lib/axios";
import { PageHeader } from "@/components/layout/PageHeader";
import { Users } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
  created_at: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");

  useEffect(() => {
    api.get("/api/users").then((response) => {
      setUsers(response.data);
    });
  }, []);

  async function fetchUsers() {
    const response = await api.get("/api/users");
    setUsers(response.data);
  }

  function openAdd() {
    setEditingUser(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("staff");
    setIsOpen(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword("");
    setRole(user.role);
    setIsOpen(true);
  }

  async function handleSave() {
    if (!email) return;

    if (editingUser) {
      const data: Record<string, string> = { name, email, role };
      if (password) data.password = password;
      await api.put(`/api/users/${editingUser.id}`, data);
    } else {
      await api.post("/api/users", { name, email, password, role });
    }

    setIsOpen(false);
    fetchUsers();
  }

  async function handleDelete() {
    console.log("handleSave called", { email, name, password, role });
    if (!editingUser) return;
    await api.delete(`/api/users/${editingUser.id}`);
    setIsOpen(false);
    fetchUsers();
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <PageHeader icon={Users} title="ユーザー管理">
        <Button
          size="sm"
          className="bg-green-600 text-white hover:bg-green-600"
          onClick={openAdd}
        >
          新規追加
        </Button>
      </PageHeader>

      <div className="flex-1 min-h-0 bg-card rounded-xl shadow-sm border overflow-hidden flex flex-col">
        <div className="flex-shrink-0 h-[42px] px-4 bg-gray-800 flex items-center">
          <span className="text-white font-bold text-sm">ユーザー一覧</span>
        </div>

        {/* テーブル */}
        <div className="flex-1 min-h-0 overflow-y-auto">
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
                    <span
                      className={`inline-block w-16 text-center px-2 py-0.5 rounded text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {user.role === "admin" ? "管理者" : "スタッフ"}
                    </span>
                  </TableCell>
                  <TableCell>{user.created_at?.split("T")[0]}</TableCell>
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
        </div>
      </div>

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
              <Label>
                パスワード{editingUser ? "（変更する場合のみ）" : ""}
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editingUser ? "変更なしなら空欄" : ""}
                required={!editingUser}
              />
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
