import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Settings, Trash2, Sparkles } from "lucide-react";

interface ModelCardProps {
  name: string;
  description: string;
  model: string;
  temperature: number;
  conversationCount: number;
  onStartChat?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ModelCard({
  name,
  description,
  model,
  temperature,
  conversationCount,
  onStartChat,
  onEdit,
  onDelete,
}: ModelCardProps) {
  return (
    <Card className="hover-elevate transition-all">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <h4 className="font-semibold text-lg truncate" data-testid="text-model-name">
                {name}
              </h4>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {description}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {model}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Temp: {temperature / 100}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                <span>{conversationCount} chat{conversationCount !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            className="flex-1 gap-2 rounded-xl"
            onClick={(e) => {
              e.stopPropagation();
              onStartChat?.();
            }}
            data-testid="button-start-chat"
          >
            <MessageSquare className="h-4 w-4" />
            Start New Chat
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            data-testid="button-edit-model"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            data-testid="button-delete-model"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
