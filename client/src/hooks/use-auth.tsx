import React, { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, InsertUser } from "@shared/schema";
import { getQueryFn, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, InsertUser>;
  isFavorite: (showId: number) => Promise<boolean>;
  toggleFavorite: (showId: number) => Promise<void>;
  isAdmin: boolean;
  isApproved: boolean;
};

interface LoginData {
  identifier: string; // Can be either email or username
  password: string;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // Remove localStorage auth checking - rely only on server sessions
  const hasStoredAuth = () => {
    return false; // Always check with server instead of localStorage
  };
  
  // Don't fetch user data on admin login page
  const isAdminLoginPage = typeof window !== 'undefined' && window.location.pathname === '/admin/login';
  
  // Fetch current user data
  const {
    data: user,
    error,
    isLoading,
    refetch
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    // This ensures we never have undefined, only null for unauthenticated users
    select: (data) => data ?? null,
    // Initialize with null (not authenticated)
    initialData: null,
    // Don't fetch on admin login page
    enabled: !isAdminLoginPage,
    // If auth token is invalid, retry a few times before giving up
    retry: 2,
    // Refresh user data every 30 minutes to reduce server load
    refetchInterval: 30 * 60 * 1000,
    // Only refetch on window focus for important state changes
    refetchOnWindowFocus: false,
    // Keep data for longer to prevent losing auth state during navigation
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Never consider the query as background refetch during navigation
    refetchOnMount: "always",
    // Ensure we have a definitive auth state before proceeding
    networkMode: "always"
  });
  
  // Effect to manage authentication state - removed localStorage dependencies

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
          credentials: "include"
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          console.log('Login error response:', errorData);
          
          // Create a custom error object with properties for approval status
          const error = new Error(errorData.message || "Login failed");
          // @ts-ignore - Adding custom property
          error.isPendingApproval = errorData.isPendingApproval || errorData.message?.includes("pending approval") || false;
          throw error;
        }
        
        return await res.json();
      } catch (err) {
        console.log('Login mutation caught error:', err);
        throw err;
      }
    },
    onSuccess: (user: User) => {
      // Only update React Query cache - no localStorage storage
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include"
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        if (errorData && errorData.message) {
          throw new Error(errorData.message);
        }
        throw new Error("Registration failed");
      }
      
      return await res.json();
    },
    onSuccess: (user: User) => {
      // Update React Query cache with user data
      queryClient.setQueryData(["/api/user"], user);
      
      // Trigger a refetch to ensure we have the latest user data
      refetch();
    },
    onError: (error: Error) => {
      
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include"
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Logout failed");
      }
    },
    onSuccess: () => {
      // Update React Query cache
      queryClient.setQueryData(["/api/user"], null);
      
      // Invalidate any query keys that depend on user authentication
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if a show is in user's favorites
  const isFavorite = async (showId: number): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const res = await fetch(`/api/favorites/${showId}`, {
        credentials: "include"
      });
      
      if (!res.ok) {
        return false;
      }
      
      const data = await res.json();
      return data.isFavorite;
    } catch (error) {
      console.error("Error checking favorite status:", error);
      return false;
    }
  };

  // Toggle favorite status for a show with optimistic updates
  const toggleFavorite = async (showId: number, currentStatus?: boolean): Promise<void> => {
    if (!user) {
      throw new Error("User must be logged in to manage favorites");
    }
    
    // Use provided status or check current status
    let isFav = currentStatus;
    if (isFav === undefined) {
      isFav = await isFavorite(showId);
    }
    
    try {
      if (isFav) {
        // Remove from favorites
        const res = await fetch(`/api/favorites/${showId}`, {
          method: "DELETE",
          credentials: "include"
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || "Failed to remove from favorites");
        }
      } else {
        // Add to favorites
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tvShowId: showId }),
          credentials: "include"
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || "Failed to add to favorites");
        }
      }
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/dashboard"] });
      
    } catch (error) {
      // Re-throw error for components to handle
      throw error;
    }
  };

  // Check if the user has admin privileges
  const isAdmin = user?.isAdmin === true;
  
  // Check if the user is approved
  const isApproved = user?.isApproved === true;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        isFavorite,
        toggleFavorite,
        isAdmin,
        isApproved,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}