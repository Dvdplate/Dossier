import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 30 * 1000,
      retry: (failureCount, error) => {
        if (error.message === "Unauthorized") return false;
        return failureCount < 3;
      },
    },
  },
});
