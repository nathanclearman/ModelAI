import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Key, AlertTriangle, CheckCircle2, Activity, Mail, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const { toast} = useToast();
  const [location, setLocation] = useLocation();

  // Account information state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");

  // Coupon code state
  const [couponCode, setCouponCode] = useState("");

  // Delete account dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  // Fetch current user data
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  // Update account information mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; companyName: string }) => {
      return await apiRequest("PATCH", "/api/auth/user", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Account information updated successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update account information",
      });
    },
  });

  // Newsletter subscription mutation
  const updateNewsletterMutation = useMutation({
    mutationFn: async (subscribed: boolean) => {
      return await apiRequest("PATCH", "/api/auth/newsletter", { subscribed });
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: response.message || "Newsletter subscription updated successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update newsletter subscription",
      });
    },
  });

  // Coupon code redemption mutation
  const applyCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      return await apiRequest("POST", "/api/auth/apply-coupon", { couponCode: code });
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setCouponCode("");
      toast({
        title: "Success",
        description: response.message || "Coupon applied successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to apply coupon",
      });
    },
  });

  // Stripe checkout mutation
  const createCheckoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/create-checkout-session", {});
      const data = await response.json();
      return data;
    },
    onSuccess: (data: any) => {
      if (data && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No checkout URL received from server",
        });
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: error.message || "Failed to create checkout session",
      });
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (password: string) => {
      return await apiRequest("DELETE", "/api/auth/user", { password });
    },
    onSuccess: () => {
      // Close dialog and reset password state
      setShowDeleteDialog(false);
      setDeletePassword("");
      
      queryClient.clear();
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted. Redirecting...",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    },
    onError: (error: any) => {
      // Don't close dialog on error, let user try again
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: error.message || "Failed to delete account. Please try again.",
      });
    },
  });

  const handleDeleteAccount = () => {
    if (!deletePassword) {
      toast({
        variant: "destructive",
        title: "Password Required",
        description: "Please enter your password to confirm account deletion.",
      });
      return;
    }
    deleteAccountMutation.mutate(deletePassword);
  };

  useEffect(() => {
    const savedKey = sessionStorage.getItem("openai_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setIsApiKeySet(true);
    }
  }, []);

  // Pre-fill account information when user data is loaded
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setCompanyName(user.companyName || "");
    }
  }, [user]);

  // Handle payment success/cancellation from Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const sessionId = params.get('session_id');
    
    if (payment === 'success' && sessionId) {
      apiRequest("GET", `/api/verify-payment?session_id=${sessionId}`)
        .then(async (response) => {
          const data = await response.json();
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          toast({
            title: "Payment Successful",
            description: data.message || "Your account has been upgraded to Pro tier!",
          });
          setLocation('/settings');
        })
        .catch((error) => {
          toast({
            variant: "destructive",
            title: "Verification Failed",
            description: error.message || "Failed to verify payment. Please contact support.",
          });
          setLocation('/settings');
        });
    } else if (payment === 'cancelled') {
      toast({
        variant: "destructive",
        title: "Payment Cancelled",
        description: "Your payment was cancelled. No charges were made.",
      });
      setLocation('/settings');
    }
  }, [toast, setLocation]);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an API key",
      });
      return;
    }

    if (!apiKey.startsWith("sk-")) {
      toast({
        variant: "destructive",
        title: "Invalid API Key",
        description: "OpenAI API keys should start with 'sk-'",
      });
      return;
    }

    sessionStorage.setItem("openai_api_key", apiKey);
    setIsApiKeySet(true);
    toast({
      title: "API Key Saved",
      description: "Your OpenAI API key has been saved for this session",
    });
  };

  const handleClearApiKey = () => {
    sessionStorage.removeItem("openai_api_key");
    setApiKey("");
    setIsApiKeySet(false);
    toast({
      title: "API Key Removed",
      description: "Your API key has been cleared",
    });
  };

  const handleSaveAccountInfo = () => {
    updateUserMutation.mutate({ firstName, lastName, companyName });
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a coupon code",
      });
      return;
    }

    applyCouponMutation.mutate(couponCode);
  };

  return (
    <div className="space-y-16">
      <div className="py-12">
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-4">ModelAI Settings</h1>
        <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
          Manage your ModelAI account and application preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Update your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingUser ? (
            <div className="flex items-center justify-center py-8">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  data-testid="input-email"
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={updateUserMutation.isPending}
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={updateUserMutation.isPending}
                  data-testid="input-last-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company Name (Optional)</Label>
                <Input
                  id="company"
                  placeholder="Enter your company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={updateUserMutation.isPending}
                  data-testid="input-company"
                />
              </div>
              <Button 
                onClick={handleSaveAccountInfo}
                disabled={updateUserMutation.isPending || isLoadingUser}
                data-testid="button-save-account"
              >
                {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {!user?.isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Usage & Limits
            </CardTitle>
            <CardDescription>Track your message usage and quota</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoadingUser ? (
              <div className="flex items-center justify-center py-8">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              </div>
            ) : (
              <>
                {(user?.messageQuota || 0) <= 0 ? (
                  <Alert variant="destructive" data-testid="alert-no-quota">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No quota assigned. You cannot send messages until an administrator assigns you a quota.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Messages Used</p>
                          <p className="text-2xl font-semibold" data-testid="text-messages-used">
                            {user!.messagesUsed} / {user!.messageQuota}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            user!.messagesUsed >= user!.messageQuota
                              ? "destructive" 
                              : user!.messagesUsed / user!.messageQuota >= 0.8 
                              ? "secondary" 
                              : "default"
                          }
                          data-testid="badge-quota-status"
                        >
                          {user!.messagesUsed >= user!.messageQuota
                            ? "Quota Exceeded" 
                            : `${Math.round((1 - user!.messagesUsed / user!.messageQuota) * 100)}% Remaining`}
                        </Badge>
                      </div>
                      
                      <Progress 
                        value={(user!.messagesUsed / user!.messageQuota) * 100} 
                        className="h-2"
                        data-testid="progress-quota"
                      />
                      
                      <p className="text-sm text-muted-foreground">
                        You have used {user!.messagesUsed} of your {user!.messageQuota} message quota.
                      </p>
                    </div>

                    {user!.messagesUsed >= user!.messageQuota && (
                      <Alert variant="destructive" data-testid="alert-quota-exceeded">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          You have exceeded your message quota. Please contact an administrator to request an increase.
                        </AlertDescription>
                      </Alert>
                    )}

                    {user!.messagesUsed / user!.messageQuota >= 0.8 && 
                     user!.messagesUsed < user!.messageQuota && (
                      <Alert data-testid="alert-quota-warning">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          You are approaching your message quota limit. Consider upgrading or contacting an administrator.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Coupon Code Redemption */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Premium Subscription
          </CardTitle>
          <CardDescription>
            Upgrade to Pro tier with a coupon code or payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {user?.couponCode ? (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                <div className="space-y-1">
                  <p className="font-medium">Active subscription via coupon: {user.couponCode}</p>
                  <p className="text-sm">
                    Applied on {new Date(user.couponAppliedAt!).toLocaleDateString()}
                  </p>
                  <p className="text-sm">
                    Current tier: <Badge variant="default" className="ml-1">{user.subscriptionTier}</Badge>
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="coupon-code">Coupon Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="coupon-code"
                    type="text"
                    placeholder="Enter coupon code (e.g., christmas2024)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={applyCouponMutation.isPending}
                    data-testid="input-coupon-code"
                  />
                  <Button 
                    onClick={handleApplyCoupon} 
                    disabled={applyCouponMutation.isPending || !couponCode.trim()}
                    data-testid="button-apply-coupon"
                  >
                    {applyCouponMutation.isPending ? "Applying..." : "Apply"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter a valid coupon code to unlock Pro tier features including increased quotas and image generation.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Separator className="flex-1" />
                <span className="text-sm text-muted-foreground">or</span>
                <Separator className="flex-1" />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Pay with Card
                  </Label>
                  <Button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      createCheckoutMutation.mutate();
                    }}
                    disabled={createCheckoutMutation.isPending}
                    className="w-full"
                    data-testid="button-stripe-payment"
                  >
                    {createCheckoutMutation.isPending ? "Processing..." : "Pay $10 for Pro Tier"}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    One-time payment of $10 for Pro tier access
                  </p>
                </div>
              </div>
              
              <div className="rounded-md bg-muted p-4 space-y-2">
                <p className="text-sm font-medium">Pro Tier Benefits:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>1,000 message quota (10x increase)</li>
                  <li>100 AI image generations</li>
                  <li>Image analysis with Gemini AI</li>
                  <li>Priority support</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates about your models and conversations
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
              data-testid="switch-email-notifications"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-save">Auto-save Conversations</Label>
              <p className="text-sm text-muted-foreground">
                Automatically save your conversations
              </p>
            </div>
            <Switch
              id="auto-save"
              checked={autoSave}
              onCheckedChange={setAutoSave}
              data-testid="switch-auto-save"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Newsletter Subscription
          </CardTitle>
          <CardDescription>
            Get updates, tips, and announcements delivered to your inbox
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="newsletter">Subscribe to Newsletter</Label>
              <p className="text-sm text-muted-foreground">
                Receive product updates, best practices, and AI tips monthly
              </p>
            </div>
            <Switch
              id="newsletter"
              checked={user?.newsletterSubscribed === 1}
              onCheckedChange={(checked) => updateNewsletterMutation.mutate(checked)}
              disabled={updateNewsletterMutation.isPending}
              data-testid="switch-newsletter"
            />
          </div>
          
          {user?.newsletterSubscribed === 1 && user?.newsletterSubscribedAt && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                Subscribed since {new Date(user.newsletterSubscribedAt).toLocaleDateString()}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="text-sm text-muted-foreground">
            <p>We'll send you:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Platform updates and new features</li>
              <li>AI model best practices and tips</li>
              <li>Community highlights and success stories</li>
              <li>Exclusive early access to new features</li>
            </ul>
            <p className="mt-2">You can unsubscribe anytime.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            OpenAI API Configuration
          </CardTitle>
          <CardDescription>
            Enter your OpenAI API key to use fine-tuned models and access your custom models
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your API key is stored securely in your browser session and is never sent to our servers. 
              It will be cleared when you close your browser.
            </AlertDescription>
          </Alert>

          {isApiKeySet && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                API key is configured. You can now use your fine-tuned models.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="openai-api-key">OpenAI API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="openai-api-key"
                  type={showApiKey ? "text" : "password"}
                  placeholder="sk-proj-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  data-testid="input-openai-api-key"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowApiKey(!showApiKey)}
                  data-testid="button-toggle-api-key-visibility"
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button 
                onClick={handleSaveApiKey}
                data-testid="button-save-api-key"
              >
                Save Key
              </Button>
              {isApiKeySet && (
                <Button
                  variant="outline"
                  onClick={handleClearApiKey}
                  data-testid="button-clear-api-key"
                >
                  Clear
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Get your API key from{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                platform.openai.com/api-keys
              </a>
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm font-medium">Why do I need this?</Label>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Access your personal fine-tuned OpenAI models</li>
              <li>Use models trained specifically for your use case</li>
              <li>API costs are billed directly to your OpenAI account</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Account Deletion</CardTitle>
          <CardDescription>Warning: This action is permanent and cannot be undone. All your data including AI models, conversations, and files will be permanently deleted.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            data-testid="button-delete-account"
            onClick={() => setShowDeleteDialog(true)}
            disabled={deleteAccountMutation.isPending}
          >
            {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This action cannot be undone. This will permanently delete your account and remove all your data from our servers including:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>All AI models and configurations</li>
                <li>All conversations and message history</li>
                <li>All uploaded documents and generated images</li>
                <li>All API keys and workflows</li>
                <li>All fine-tuning files and jobs</li>
              </ul>
              <p className="mt-4">
                Please enter your password to confirm:
              </p>
              <Input
                type="password"
                placeholder="Enter your password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                data-testid="input-delete-password"
                className="mt-2"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setDeletePassword("");
                setShowDeleteDialog(false);
              }}
              data-testid="button-cancel-delete"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAccount();
              }}
              disabled={deleteAccountMutation.isPending || !deletePassword}
              data-testid="button-confirm-delete"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
