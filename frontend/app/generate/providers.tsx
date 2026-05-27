"use client";

import * as React from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 60 * 24,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }

  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }

  return browserQueryClient;
}

export default function GenerateProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();

  const persister =
    typeof window !== "undefined"
      ? createSyncStoragePersister({
          storage: window.localStorage,
          key: "generate-email-cache-v1",
        })
      : undefined;

  if (!persister) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24,
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}