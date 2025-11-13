import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Zap, Image, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type User } from "@shared/schema";
import { Link } from "wouter";

export function UsageWidget() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  if (!user) return null;

  const messagePercentage = user.messageQuota > 0 ? (user.messagesUsed / user.messageQuota) * 100 : 0;
  const imagePercentage = user.imageQuota > 0 ? (user.imagesUsed / user.imageQuota) * 100 : 0;

  const isMessageNearLimit = messagePercentage >= 80;
  const isImageNearLimit = imagePercentage >= 80;
  const isAnyNearLimit = isMessageNearLimit || isImageNearLimit;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "free":
        return "bg-muted text-muted-foreground";
      case "pro":
        return "bg-primary/10 text-primary border-primary/20";
      case "enterprise":
        return "bg-accent/10 text-accent-foreground border-accent/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTierLabel = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  return (
    <Card data-testid="card-usage-widget">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">Usage & Limits</CardTitle>
          <CardDescription>Track your monthly quota</CardDescription>
        </div>
        <Badge 
          variant="outline" 
          className={getTierColor(user.subscriptionTier)}
          data-testid="badge-subscription-tier"
        >
          <Zap className="w-3 h-3 mr-1" />
          {getTierLabel(user.subscriptionTier)}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Messages</span>
            </div>
            <span className="text-muted-foreground">
              <span className={isMessageNearLimit ? "text-destructive font-medium" : ""} data-testid="text-messages-used">
                {user.messagesUsed}
              </span>
              {" / "}
              <span data-testid="text-messages-quota">{user.messageQuota}</span>
            </span>
          </div>
          <Progress 
            value={messagePercentage} 
            className="h-2"
            data-testid="progress-messages"
          />
          {isMessageNearLimit && (
            <div className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="w-3 h-3" />
              <span>Approaching message limit</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Image Generations</span>
            </div>
            <span className="text-muted-foreground">
              <span className={isImageNearLimit ? "text-destructive font-medium" : ""} data-testid="text-images-used">
                {user.imagesUsed}
              </span>
              {" / "}
              <span data-testid="text-images-quota">{user.imageQuota}</span>
            </span>
          </div>
          <Progress 
            value={imagePercentage} 
            className="h-2"
            data-testid="progress-images"
          />
          {isImageNearLimit && (
            <div className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="w-3 h-3" />
              <span>Approaching image limit</span>
            </div>
          )}
        </div>

        {isAnyNearLimit && user.subscriptionTier === "free" && (
          <div className="pt-2 border-t">
            <Link href="/settings">
              <Button 
                variant="default" 
                size="sm" 
                className="w-full"
                data-testid="button-upgrade"
              >
                <Zap className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            </Link>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center pt-2">
          Quotas reset monthly on your billing date
        </div>
      </CardContent>
    </Card>
  );
}
