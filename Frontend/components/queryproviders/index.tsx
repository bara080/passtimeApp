import { PropsWithChildren } from "react";
import {
  focusManager,
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import NetInfo from "@react-native-community/netinfo";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persistQueryClient } from "@tanstack/react-query-persist-client";

// Refetch when app returns to foreground
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener("change", (state) => {
    handleFocus(state === "active");
  });
  return () => subscription.remove();
});

// Single source of truth for online state
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    const online =
      !!state.isConnected &&
      (state.isInternetReachable === null || state.isInternetReachable === true);
    setOnline(online);
  });
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,  // 24h
      staleTime: 1000 * 60 * 5,      // 5min
      networkMode: "offlineFirst",
      retry: 1,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
    },
    mutations: {
      networkMode: "offlineFirst",
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "PASSTIME_QUERY_CACHE",
  throttleTime: 1000,
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24h
});

export function QueryProvider({ children }: PropsWithChildren) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
