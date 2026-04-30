import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n/config";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import { NotificationProvider } from "./providers/NotificationProvider.tsx";
import { ThemeProvider } from "./providers/ThemeProvider.tsx";
import { NetworkStatusProvider } from "./providers/NetworkStatusProvider.tsx";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WalletProvider } from "./providers/WalletProvider.tsx";

// Configure React Query with caching for Stellar network efficiency
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 30 seconds by default
      staleTime: 30 * 1000,
      // Keep unused data in cache for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Don't refetch on window focus (avoids unnecessary RPC calls)
      refetchOnWindowFocus: false,
      // Don't retry failed requests (fail fast for better UX)
      retry: false,
      // Network mode for SSR compatibility
      networkMode: 'online',
    },
    mutations: {
      // Network mode for mutations
      networkMode: 'online',
    },
  },
});

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <ErrorBoundary region="root">
      <ThemeProvider>
        <NotificationProvider>
          <NetworkStatusProvider>
            <QueryClientProvider client={queryClient}>
              <WalletProvider>
                <BrowserRouter>
                  <App />
                </BrowserRouter>
              </WalletProvider>
            </QueryClientProvider>
          </NetworkStatusProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
