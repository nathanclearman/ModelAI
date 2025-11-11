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
    <Card className="hover-elevate transition-all">
      <CardHeader>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="line-clamp-2">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={() => {
            console.log(`Using template: ${title}`);
            onUse?.();
          }}
          className="w-full"
          data-testid={`button-use-${title.toLowerCase().replace(/\s+/g, "-")}`}
        >
          Use Template
        </Button>
      </CardContent>
    </Card>
  );
}
