"use client";

import { SWRConfig } from "swr";
import { swrConfig, fetcher } from "@/lib/swr-config";

export default function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        ...swrConfig,
        fetcher,
        // Enable suspense mode for better streaming
        suspense: false, // Keep false for client components, enable per-hook if needed
      }}
    >
      {children}
    </SWRConfig>
  );
}
