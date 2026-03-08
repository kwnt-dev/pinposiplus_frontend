"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HelpButtonProps {
  title: string;
  children: React.ReactNode;
}

export function HelpButton({ title, children }: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-8 h-8 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-600 font-bold text-lg flex items-center justify-center transition-colors"
        aria-label="ヘルプ"
      >
        ?
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-3">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
