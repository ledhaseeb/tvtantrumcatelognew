import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export function AdminRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  // We'll need to check if user is admin via an API call
  const { data: isAdmin } = useQuery({
    queryKey: ["/api/user/is-admin"],
    enabled: !!user,
  });
  const { toast } = useToast();

  useEffect(() => {
    // If user is logged in but not an admin, show toast
    if (user && isAdmin === false) {
      toast({
        title: "Access Denied",
        description: "You do not have admin privileges to access this page.",
        variant: "destructive",
      });
    }
  }, [user, isAdmin, toast]);

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // If not logged in, redirect to auth page
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If logged in but not an admin, redirect to home
  if (isAdmin === false) {
    return (
      <Route path={path}>
        <Redirect to="/home" />
      </Route>
    );
  }

  // If logged in, approved, and an admin, show the component
  return <Route path={path}><Component /></Route>;
}