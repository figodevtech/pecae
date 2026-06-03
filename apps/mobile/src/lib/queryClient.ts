import { QueryClient } from '@tanstack/react-query';

// QueryClient singleton exported to be shared across the app
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60, // 1 minuto
    },
  },
});
