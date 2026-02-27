"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
      title={theme === "dark" ? "ライトモードに切替" : "ダークモードに切替"}
    >
      {theme === "dark" ? (
        <Sun size={18} className="text-yellow-300" />
      ) : (
        <Moon size={18} className="text-gray-300" />
      )}
    </button>
  );
}
