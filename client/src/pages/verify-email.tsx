import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get token from URL
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (!token) {
          setStatus("error");
          setMessage("No verification token found");
          return;
        }

        // Call verification endpoint
        const response = await apiRequest("GET", `/api/auth/verify-email?token=${token}`, null);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || "Email verification failed");
        }

        const data = await response.json();

        // Verification successful
        setStatus("success");
        setMessage(data.message || "Email verified successfully!");

        // Invalidate user query to refresh authentication state
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          setLocation("/");
        }, 2000);
      } catch (error: any) {
        setStatus("error");
        setMessage(error.message || "Email verification failed. The link may be invalid or expired. Please try registering again.");
      }
    };

    verifyEmail();
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === "verifying" && (
            <>
              <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin" />
              <CardTitle className="mt-4">Verifying Email</CardTitle>
              <CardDescription>Please wait while we verify your email address...</CardDescription>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
              <CardTitle className="mt-4">Email Verified!</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="h-16 w-16 mx-auto text-destructive" />
              <CardTitle className="mt-4">Verification Failed</CardTitle>
              <CardDescription className="text-destructive">{message}</CardDescription>
            </>
          )}
        </CardHeader>
        {status === "success" && (
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Redirecting you to the dashboard...
            </p>
          </CardContent>
        )}
        {status === "error" && (
          <CardContent className="text-center">
            <Button onClick={() => setLocation("/")}>Go to Login</Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
