import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    api
      .get("/api/me")
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const logout = async () => {
    try {
      await api.post("/api/logout");
    } catch {
      // トークン無効でも続行
    } finally {
      localStorage.removeItem("token");
      router.push("/login");
    }
  };

  return { user, isLoading, logout };
}
