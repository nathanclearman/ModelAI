import { StatsCard } from "../stats-card";
import { Sparkles } from "lucide-react";

export default function StatsCardExample() {
  return (
    <div className="p-6 max-w-sm">
      <StatsCard
        title="Active Models"
        value={12}
        description="Currently deployed"
        icon={Sparkles}
        trend={{ value: 20, isPositive: true }}
      />
    </div>
  );
}
