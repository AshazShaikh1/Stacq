/**
 * SWR fetcher function
 * Used for client-side data fetching with caching
 */
export const fetcher = async (url: string) => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // @ts-ignore
    error.info = await res.json();
    // @ts-ignore
    error.status = res.status;
    throw error;
  }
  
  return res.json();
};

/**
 * SWR configuration
 */
export const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000, // Dedupe requests within 2 seconds
  refreshInterval: 0, // Disable auto-refresh by default
};

