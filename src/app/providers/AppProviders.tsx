import React from "react";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { networkConfig, DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import { Toaster } from "@/shared/components/ui/sonner";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 30_000,
      },
      mutations: {
        retry: 1,
      },
    },
  });

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = React.useState(createQueryClient);

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider
          networks={networkConfig}
          defaultNetwork={DEFAULT_NETWORK}
        >
          <WalletProvider autoConnect>
            <BrowserRouter>
              {children}
              <Toaster position="top-right" />
            </BrowserRouter>
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}
