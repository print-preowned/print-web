// src/providers/QueryProvider.tsx
"use client";

import { apiFetch } from "@/lib/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export interface MutationVariables {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  body: unknown;
}


export default function QueryProvider({ children }: { children: ReactNode }) {
  // Ensure a stable client across re-renders
  const [client] = useState(() => new QueryClient(
    {
        defaultOptions: {
            queries: {
                queryFn: ({queryKey}) => {
                  console.log("======> queryKey", queryKey[0]);
                    return apiFetch(queryKey[0] as string)
                },
                refetchOnWindowFocus: false,
                refetchOnMount: false,
                refetchOnReconnect: false,
                staleTime: 1000 * 60 * 5, // 5 minutes
            },
            mutations: {
              mutationFn: (variables: unknown) => {
                const { endpoint, method, body } = variables as MutationVariables
                return apiFetch(endpoint, { method: method || "POST", body })
              },
            },
          },
        })
    );

  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}
