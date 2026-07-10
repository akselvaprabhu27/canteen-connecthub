import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  change?: string;
}

export function StatCard({ title, value, icon, change }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-card-foreground">{value}</p>
      {change && <p className="mt-1 text-xs font-medium text-success">{change}</p>}
    </div>
  );
}
