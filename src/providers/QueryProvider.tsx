// src/providers/QueryProvider.tsx
"use client";

import { apiFetch } from "@/lib/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export interface MutationVariables {
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
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
                if (!variables || typeof variables !== "object") {
                  throw new Error("Invalid variables");
                }

                const v = variables as Partial<MutationVariables>;
                if (!v.endpoint || typeof v.endpoint !== "string") {
                  throw new Error("Invalid mutation endpoint");
                }

                const method = (v.method ?? "POST") as MutationVariables["method"];
                return apiFetch(v.endpoint, { method, body: v.body });
              },
            },
          },
        })
    );

  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}
