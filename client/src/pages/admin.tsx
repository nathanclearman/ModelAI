import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Brain, MessageSquare, Clock, ShieldAlert, Shield, ShieldCheck, Download, Eye, DollarSign, ArrowUpDown, Mail, Send } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Conversation } from "@shared/schema";

interface AdminStats {
  totalUsers: number;
  totalModels: number;
  totalConversations: number;
  recentUsers: User[];
}

interface UserCostStat {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  messageQuota: number;
  messagesUsed: number;
  totalMessages: number;
  totalCost: string;
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
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sortBy, setSortBy] = useState<'cost' | 'usage'>('cost');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [newsletterForm, setNewsletterForm] = useState({
    subject: '',
    headline: '',
    content: '',
    ctaText: '',
    ctaUrl: ''
  });

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isAdmin,
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdmin,
  });

  const { data: userConversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: [`/api/admin/users/${selectedUser?.id}/conversations`],
    enabled: !!selectedUser,
  });

  const { data: costStats = [], isLoading: costStatsLoading } = useQuery<UserCostStat[]>({
    queryKey: ["/api/admin/cost-stats"],
    enabled: isAdmin,
  });

  const { data: subscriberData } = useQuery<{ count: number; subscribers: any[] }>({
    queryKey: ["/api/admin/newsletter/subscribers"],
    enabled: isAdmin,
  });

  const sendNewsletterMutation = useMutation({
    mutationFn: async (data: typeof newsletterForm) => {
      const response = await apiRequest("POST", "/api/admin/newsletter/send", data);
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Newsletter Sent!",
        description: `Successfully sent to ${data.successCount} of ${data.totalSubscribers} subscribers`,
      });
      setNewsletterForm({ subject: '', headline: '', content: '', ctaText: '', ctaUrl: '' });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send newsletter",
      });
    },
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: number }) => {
      return await apiRequest("PATCH", `/api/admin/users/${userId}/admin-status`, { isAdmin: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Success",
        description: "Admin status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update admin status",
      });
    },
  });

  const exportConversation = (conversation: Conversation) => {
    const messages = conversation.messages as any[];
    const jsonlContent = messages.map(msg => JSON.stringify(msg)).join('\n');
    const blob = new Blob([jsonlContent], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${conversation.id}.jsonl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAllConversations = () => {
    if (!userConversations.length) return;
    
    const allMessages = userConversations.flatMap(conv => 
      (conv.messages as any[]).map(msg => JSON.stringify(msg))
    );
    const jsonlContent = allMessages.join('\n');
    const blob = new Blob([jsonlContent], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedUser?.firstName}-${selectedUser?.lastName}-all-conversations.jsonl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleSort = (column: 'cost' | 'usage') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  const sortedCostStats = [...costStats].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    if (sortBy === 'cost') {
      const costA = parseFloat(a.totalCost.replace(/[^0-9.-]/g, '')) || 0;
      const costB = parseFloat(b.totalCost.replace(/[^0-9.-]/g, '')) || 0;
      return multiplier * (costA - costB);
    } else {
      return multiplier * (a.messagesUsed - b.messagesUsed);
    }
  });

  const getQuotaStatus = (used: number, quota: number) => {
    const percentage = used / quota;
    if (percentage >= 1) return 'exceeded';
    if (percentage >= 0.8) return 'warning';
    return 'normal';
  };

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
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">ModelAI Admin Dashboard</h1>
          <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Manage ModelAI users, monitor platform activity, and view system statistics
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Send Newsletter
              </CardTitle>
              <CardDescription>
                Compose and send newsletters to all subscribers
              </CardDescription>
            </div>
            <Badge variant="outline" data-testid="badge-subscriber-count">
              {subscriberData?.count || 0} subscribers
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscriberData && subscriberData.count === 0 && (
            <Alert data-testid="alert-no-subscribers">
              <Mail className="h-4 w-4" />
              <AlertDescription>
                No newsletter subscribers yet. Users can subscribe from their Settings page.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="newsletter-subject">Subject Line</Label>
            <Input
              id="newsletter-subject"
              placeholder="e.g., 🚀 ModelAI Updates - December 2024"
              value={newsletterForm.subject}
              onChange={(e) => setNewsletterForm({...newsletterForm, subject: e.target.value})}
              disabled={sendNewsletterMutation.isPending}
              data-testid="input-newsletter-subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newsletter-headline">Headline</Label>
            <Input
              id="newsletter-headline"
              placeholder="e.g., What's New at ModelAI"
              value={newsletterForm.headline}
              onChange={(e) => setNewsletterForm({...newsletterForm, headline: e.target.value})}
              disabled={sendNewsletterMutation.isPending}
              data-testid="input-newsletter-headline"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newsletter-content">Content (HTML supported)</Label>
            <Textarea
              id="newsletter-content"
              placeholder="<p>We're excited to share the latest updates...</p>
<ul>
  <li>New AI models available</li>
  <li>Improved performance</li>
  <li>Bug fixes and enhancements</li>
</ul>"
              value={newsletterForm.content}
              onChange={(e) => setNewsletterForm({...newsletterForm, content: e.target.value})}
              disabled={sendNewsletterMutation.isPending}
              rows={8}
              data-testid="textarea-newsletter-content"
            />
            <p className="text-xs text-muted-foreground">
              You can use HTML tags for formatting (p, ul, li, strong, em, etc.)
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newsletter-cta-text">Call-to-Action Text (optional)</Label>
              <Input
                id="newsletter-cta-text"
                placeholder="e.g., Explore New Features"
                value={newsletterForm.ctaText}
                onChange={(e) => setNewsletterForm({...newsletterForm, ctaText: e.target.value})}
                disabled={sendNewsletterMutation.isPending}
                data-testid="input-newsletter-cta-text"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newsletter-cta-url">Call-to-Action URL (optional)</Label>
              <Input
                id="newsletter-cta-url"
                placeholder="e.g., https://your-app.com/models"
                value={newsletterForm.ctaUrl}
                onChange={(e) => setNewsletterForm({...newsletterForm, ctaUrl: e.target.value})}
                disabled={sendNewsletterMutation.isPending}
                data-testid="input-newsletter-cta-url"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={() => sendNewsletterMutation.mutate(newsletterForm)}
              disabled={
                sendNewsletterMutation.isPending || 
                !newsletterForm.subject || 
                !newsletterForm.headline || 
                !newsletterForm.content ||
                (subscriberData?.count || 0) === 0
              }
              className="gap-2"
              data-testid="button-send-newsletter"
            >
              <Send className="h-4 w-4" />
              {sendNewsletterMutation.isPending ? "Sending..." : "Send Newsletter"}
            </Button>
            {newsletterForm.subject || newsletterForm.headline || newsletterForm.content ? (
              <Button
                variant="outline"
                onClick={() => setNewsletterForm({ subject: '', headline: '', content: '', ctaText: '', ctaUrl: '' })}
                disabled={sendNewsletterMutation.isPending}
                data-testid="button-clear-newsletter"
              >
                Clear
              </Button>
            ) : null}
          </div>

          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Newsletter will be sent to {subscriberData?.count || 0} subscriber{subscriberData?.count !== 1 ? 's' : ''}. 
              Emails are sent sequentially with a small delay to avoid rate limiting.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

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
              {allUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/20 text-sm"
                  data-testid={`all-user-${u.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {u.firstName} {u.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {u.email}
                    </div>
                  </div>
                  {u.isAdmin === 1 && (
                    <Badge variant="default" className="ml-2">Admin</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Manage Administrators</CardTitle>
              <CardDescription>
                Grant or revoke admin privileges for users
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover-elevate"
                data-testid={`manage-admin-${u.id}`}
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {u.firstName} {u.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {u.email}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {u.isAdmin === 1 && (
                    <Badge variant="default">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedUser(u)}
                    data-testid={`view-conversations-${u.id}`}
                  >
                    <Eye className="h-3 w-3 mr-2" />
                    View Conversations
                  </Button>
                  {u.id === user?.id ? (
                    <Badge variant="outline">You</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant={u.isAdmin === 1 ? "destructive" : "default"}
                      onClick={() => toggleAdminMutation.mutate({
                        userId: u.id,
                        newStatus: u.isAdmin === 1 ? 0 : 1
                      })}
                      disabled={toggleAdminMutation.isPending}
                      data-testid={`toggle-admin-${u.id}`}
                    >
                      {u.isAdmin === 1 ? "Remove Admin" : "Make Admin"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {allUsers.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No users yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Usage & Costs</CardTitle>
              <CardDescription>
                Track user message quotas and platform costs
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {costStatsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            </div>
          ) : sortedCostStats.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No usage data available</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead data-testid="header-user">User</TableHead>
                    <TableHead data-testid="header-email">Email</TableHead>
                    <TableHead data-testid="header-usage">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => toggleSort('usage')}
                        data-testid="button-sort-usage"
                      >
                        Usage
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead data-testid="header-status">Status</TableHead>
                    <TableHead data-testid="header-total-messages">Total Messages</TableHead>
                    <TableHead data-testid="header-total-cost">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => toggleSort('cost')}
                        data-testid="button-sort-cost"
                      >
                        Total Cost
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCostStats.map((stat) => {
                    const quotaStatus = getQuotaStatus(stat.messagesUsed, stat.messageQuota);
                    return (
                      <TableRow key={stat.userId} data-testid={`cost-row-${stat.userId}`}>
                        <TableCell className="font-medium" data-testid={`cell-user-${stat.userId}`}>
                          {stat.firstName} {stat.lastName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground" data-testid={`cell-email-${stat.userId}`}>
                          {stat.email}
                        </TableCell>
                        <TableCell data-testid={`cell-usage-${stat.userId}`}>
                          <span className="text-sm">
                            {stat.messagesUsed} / {stat.messageQuota}
                          </span>
                        </TableCell>
                        <TableCell data-testid={`cell-status-${stat.userId}`}>
                          <Badge
                            variant={
                              quotaStatus === 'exceeded'
                                ? 'destructive'
                                : quotaStatus === 'warning'
                                ? 'secondary'
                                : 'default'
                            }
                            data-testid={`badge-status-${stat.userId}`}
                          >
                            {quotaStatus === 'exceeded'
                              ? 'Over Quota'
                              : quotaStatus === 'warning'
                              ? 'Near Limit'
                              : 'Normal'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm" data-testid={`cell-total-messages-${stat.userId}`}>
                          {stat.totalMessages}
                        </TableCell>
                        <TableCell className="font-medium" data-testid={`cell-total-cost-${stat.userId}`}>
                          ${parseFloat(stat.totalCost.replace(/[^0-9.-]/g, '') || '0').toFixed(4)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.firstName} {selectedUser?.lastName}'s Conversations
            </DialogTitle>
            <DialogDescription>
              View and export all conversations for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {conversationsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              </div>
            ) : userConversations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No conversations yet
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-4 border-b">
                  <div className="text-sm text-muted-foreground">
                    {userConversations.length} conversation{userConversations.length !== 1 ? 's' : ''}
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={exportAllConversations}
                    data-testid="export-all-conversations"
                  >
                    <Download className="h-3 w-3 mr-2" />
                    Export All
                  </Button>
                </div>

                <div className="space-y-3">
                  {userConversations.map((conversation) => {
                    const messages = conversation.messages as any[];
                    const messageCount = messages?.length || 0;
                    const lastMessage = messages?.[messages.length - 1];

                    return (
                      <div
                        key={conversation.id}
                        className="p-4 rounded-xl bg-muted/30 hover-elevate"
                        data-testid={`conversation-${conversation.id}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium truncate">
                                {conversation.title || 'Untitled Conversation'}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {messageCount} message{messageCount !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            {lastMessage && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {lastMessage.content}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {conversation.updatedAt && format(new Date(conversation.updatedAt), 'MMM d, yyyy h:mm a')}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportConversation(conversation)}
                            data-testid={`export-conversation-${conversation.id}`}
                          >
                            <Download className="h-3 w-3 mr-2" />
                            Export
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
