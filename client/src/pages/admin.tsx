import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Brain, MessageSquare, Clock, ShieldAlert } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";

interface AdminStats {
  totalUsers: number;
  totalModels: number;
  totalConversations: number;
  recentUsers: User[];
}

function StatsCard({ title, value, description, icon: Icon }: {
  title: string;
  value: number;
  description: string;
  icon: any;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function Admin() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isAdmin,
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdmin,
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    );
  }

  // Show access denied for non-admin users
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-32">
        <Card className="max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription className="text-base">
              You do not have permission to access the admin dashboard. This area is restricted to administrators only.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button 
              onClick={() => setLocation("/")}
              data-testid="button-back-to-dashboard"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      <div className="relative py-16 px-8 -mx-8 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/5 to-background overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-40"></div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <span>Admin Access</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">Admin Dashboard</h1>
          <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Manage users, monitor platform activity, and view system statistics
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          description="Registered users"
          icon={Users}
        />
        <StatsCard
          title="AI Models"
          value={stats?.totalModels || 0}
          description="Created models"
          icon={Brain}
        />
        <StatsCard
          title="Conversations"
          value={stats?.totalConversations || 0}
          description="Total conversations"
          icon={MessageSquare}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>
              Latest user registrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover-elevate"
                  data-testid={`recent-user-${user.id}`}
                >
                  <div className="flex-1">
                    <div className="font-medium" data-testid={`user-name-${user.id}`}>
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground" data-testid={`user-email-${user.id}`}>
                      {user.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {user.isAdmin === 1 && (
                      <Badge variant="default" data-testid={`admin-badge-${user.id}`}>
                        Admin
                      </Badge>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span data-testid={`user-created-${user.id}`}>
                        {formatDistanceToNow(new Date(user.createdAt!), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {(!stats?.recentUsers || stats.recentUsers.length === 0) && (
                <p className="text-center text-muted-foreground py-8">No users yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              {allUsers.length} total registered users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {allUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/20 text-sm"
                  data-testid={`all-user-${user.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </div>
                  </div>
                  {user.isAdmin === 1 && (
                    <Badge variant="default" className="ml-2">Admin</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
