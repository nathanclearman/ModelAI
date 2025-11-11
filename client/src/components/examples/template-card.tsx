import { TemplateCard } from "../template-card";
import { Headphones } from "lucide-react";

export default function TemplateCardExample() {
  return (
    <div className="p-6 max-w-sm">
      <TemplateCard
        title="Customer Support"
        description="AI assistant trained to handle customer inquiries with empathy and professionalism"
        icon={Headphones}
        onUse={() => console.log("Template used")}
      />
    </div>
  );
}
