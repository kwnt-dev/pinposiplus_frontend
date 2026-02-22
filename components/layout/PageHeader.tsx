import { type LucideIcon } from "lucide-react";

interface PageHeaderProps {
  icon?: LucideIcon;
  title: string;
  children?: React.ReactNode;
}

export function PageHeader({ icon: Icon, title, children }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between mb-4">
      <h1 className="text-xl font-bold flex items-center gap-2">
        {Icon && <Icon size={20} />}
        {title}
      </h1>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  );
}
