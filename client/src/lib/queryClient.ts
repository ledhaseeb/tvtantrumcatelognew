import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText || 'Request failed';
    try {
      // Clone the response to avoid consuming the body
      const clonedRes = res.clone();
      const text = await clonedRes.text();
      if (text) {
        errorMessage = text;
      }
    } catch (e) {
      console.error('Error reading response text:', e);
    }
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Ensure we always send cookies/credentials with every request
  const headers: HeadersInit = {
    'Accept': 'application/json'
  };
  
  if (data) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Return the actual Response object instead of parsing JSON
  // This allows the caller to handle the response as needed
  return fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // Always include credentials (cookies)
  });
}

export async function apiGet<T = any>(url: string): Promise<T> {
  const response = await apiRequest('GET', url);
  await throwIfResNotOk(response);
  return await response.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Handle basic URL vs. URL with filters
    let url = queryKey[0] as string;
    
    // If there are filters in the second element of the queryKey
    if (queryKey.length > 1 && typeof queryKey[1] === 'object' && queryKey[1] !== null) {
      const filters = queryKey[1] as Record<string, any>;
      
      // Build query parameters 
      if (Object.keys(filters).length > 0) {
        const searchParams = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              searchParams.append(key, value.join(','));
            } else if (typeof value === 'object') {
              // For objects like stimulationScoreRange
              searchParams.append(key, JSON.stringify(value));
            } else {
              searchParams.append(key, String(value));
            }
          }
        });
        
        // Append query string to URL
        const queryString = searchParams.toString();
        if (queryString) {
          url = `${url}?${queryString}`;
          console.log('Debug - URL with filters:', url);
        }
      }
    }
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes for better caching under high load
      gcTime: 30 * 60 * 1000, // 30 minutes garbage collection time
      retry: (failureCount, error) => {
        // Don't retry 404s or client errors, only network/server errors
        if (error.message.includes('404') || error.message.includes('401')) {
          return false;
        }
        return failureCount < 2; // Max 2 retries for network issues
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: false,
    },
  },
});
