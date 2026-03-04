"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";
import { trpc } from "./trpc";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Datos frescos por 30 segundos - evita refetch innecesarios
        staleTime: 30 * 1000,
        // Cache por 5 minutos
        gcTime: 5 * 60 * 1000,
        // No refetch al volver a la pestaña (admin no necesita real-time)
        refetchOnWindowFocus: false,
        // Reintentar 1 vez en caso de error
        retry: 1,
      },
    },
  });
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
          // Headers para evitar caché del navegador en API calls
          headers: () => ({
            "x-trpc-source": "react",
          }),
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
