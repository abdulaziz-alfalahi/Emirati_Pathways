
import React, { createContext, useContext } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient();

const QueryContext = createContext<QueryClient | undefined>(undefined);

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export function useQuery() {
  const context = useContext(QueryContext);
  if (context === undefined) {
    throw new Error('useQuery must be used within a QueryProvider');
  }
  return context;
}
