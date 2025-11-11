import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface TemplateCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onUse?: () => void;
}

export function TemplateCard({ title, description, icon: Icon, onUse }: TemplateCardProps) {
  return (
    <Card className="hover-elevate transition-all duration-300 border-none shadow-lg">
      <CardHeader className="p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl mb-3">{title}</CardTitle>
        <CardDescription className="text-base leading-relaxed line-clamp-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-8 pt-0">
        <Button
          onClick={() => {
            console.log(`Using template: ${title}`);
            onUse?.();
          }}
          className="w-full text-base py-6 rounded-xl"
          data-testid={`button-use-${title.toLowerCase().replace(/\s+/g, "-")}`}
        >
          Use Template
        </Button>
      </CardContent>
    </Card>
  );
}
