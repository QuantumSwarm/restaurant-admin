"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Refine } from "@refinedev/core";
import routerBindings from "@refinedev/nextjs-router";
import { ReactNode } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Refine
        routerProvider={routerBindings}
        options={{
          syncWithLocation: true,
          warnWhenUnsavedChanges: true,
        }}
      >
        {children}
      </Refine>
    </QueryClientProvider>
  );
}
