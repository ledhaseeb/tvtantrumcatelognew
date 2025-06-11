import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export function ApprovedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    // If user is logged in but not approved, show toast and redirect
    if (user && user.isApproved === false) {
      toast({
        title: "Access Denied",
        description: "Your account is pending approval by an administrator.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Show loading state when authenticating OR when we have no user and not done loading
  if (isLoading || (!user && !isLoading)) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // Only redirect if we're definitively not logged in (not loading and no user)
  if (!isLoading && !user) {
    return (
      <Route path={path}>
        <Redirect to="/early-access" />
      </Route>
    );
  }

  // Auto-approve all logged in users (GHL integration handles verification)
  // If logged in, show the component
  return <Route path={path}><Component /></Route>;
}