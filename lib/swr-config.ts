// SWR Configuration and Custom Fetcher

export const swrConfig = {
  // Revalidate on window focus (disable for admin panel - only revalidate when user explicitly refreshes)
  revalidateOnFocus: false,
  
  // Revalidate on network reconnect
  revalidateOnReconnect: true,
  
  // Deduplicate requests within 5 seconds (longer window = fewer requests)
  dedupingInterval: 5000,
  
  // Disable auto refresh - admin data doesn't change that often
  // Users can manually refresh if needed
  refreshInterval: 0,
  
  // Retry on error with exponential backoff
  shouldRetryOnError: true,
  errorRetryCount: 2,
  errorRetryInterval: 3000,
  
  // Keep previous data while revalidating for instant page transitions
  keepPreviousData: true,
  
  // Revalidate if data is older than 5 minutes
  revalidateIfStale: true,
  
  // Compare function to prevent unnecessary re-renders
  compare: (a: any, b: any) => {
    return JSON.stringify(a) === JSON.stringify(b);
  },
};

// Global fetcher function for SWR
export const fetcher = async (url: string) => {
  const response = await fetch(url);
  
  // Handle error responses
  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object
    (error as any).info = await response.json();
    (error as any).status = response.status;
    throw error;
  }
  
  return response.json();
};

// Typed fetcher for better TypeScript support
export const typedFetcher = <T>(url: string): Promise<T> => {
  return fetcher(url);
};
