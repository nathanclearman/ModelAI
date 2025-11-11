import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ConversationCardProps {
  title: string;
  modelName: string;
  timestamp: string;
  preview: string;
  messageCount: number;
  onClick?: () => void;
  onDelete?: () => void;
}

export function ConversationCard({
  title,
  modelName,
  timestamp,
  preview,
  messageCount,
  onClick,
  onDelete,
}: ConversationCardProps) {
  return (
    <Card className="hover-elevate transition-all cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium truncate" data-testid="text-conversation-title">
                {title}
              </h4>
              <Badge variant="secondary" className="text-xs">
                {modelName}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {preview}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{messageCount} messages</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{timestamp}</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              console.log("Delete conversation:", title);
              onDelete?.();
            }}
            data-testid="button-delete-conversation"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
