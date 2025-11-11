import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatsCard({ title, value, description, icon: Icon, trend }: StatsCardProps) {
  return (
    <Card className="border-none shadow-lg">
      <CardContent className="p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-base font-medium text-muted-foreground mb-3">{title}</p>
            <p className="text-4xl font-semibold tracking-tight" data-testid={`text-stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>
              {value}
            </p>
            {description && (
              <p className="text-sm text-muted-foreground mt-2">{description}</p>
            )}
            {trend && (
              <p className={`text-sm mt-3 font-medium ${trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}% from last month
              </p>
            )}
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Icon className="h-8 w-8 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
