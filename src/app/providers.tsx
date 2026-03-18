import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

type AppProvidersProps = {
  children: ReactNode;
};

export const AppProviders = ({ children }: AppProvidersProps) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
