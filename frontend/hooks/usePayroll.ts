import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  getAllVaultData,
  getVaultBalance,
  type TokenVaultData,
} from "../contracts/payroll_vault";
import {
  getStreamsByEmployer,
  getStreamById,
  getTokenSymbol,
  ContractStream,
} from "../contracts/payroll_stream";

/** Stellar uses 7 decimal places (10^7 stroops = 1 token unit). */
const STROOPS_PER_UNIT = 1e7;

/** Cache keys for React Query */
export const CACHE_KEYS = {
  vaultData: (address: string) => ["vault", address] as const,
  streams: (address: string) => ["streams", address] as const,
  stream: (address: string, streamId: string) => ["stream", address, streamId] as const,
} as const;

/** Normalised view of a payroll stream as seen by the employer dashboard. */
export interface Stream {
  id: string;
  employeeName: string;
  employeeAddress: string;
  flowRate: string;
  tokenSymbol: string;
  startDate: string;
  endDate: string;
  totalAmount: string;
  totalStreamed: string;
  status: "active" | "completed" | "cancelled";
}

/** Token balance as reported by the PayrollVault contract. */
export interface TokenBalance {
  tokenSymbol: string;
  balance: string;
}

// Default tokens to monitor (XLM and USDC)
const USDC_ISSUER = import.meta.env.PUBLIC_USDC_ISSUER || "";

const DEFAULT_TOKENS: Array<{ token: string; tokenSymbol: string; monthlyBurnRate: bigint }> = [
  { token: "", tokenSymbol: "XLM", monthlyBurnRate: 0n },
  { token: USDC_ISSUER, tokenSymbol: "USDC", monthlyBurnRate: 0n },
];

// Cache configuration: 30 seconds stale time, 5 minutes cache
const VAULT_QUERY_OPTIONS = {
  staleTime: 30 * 1000, // 30 seconds
  gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
  refetchOnWindowFocus: false,
  retry: false,
} as const;

/**
 * Fetches vault balances for an employer with React Query caching.
 * 
 * @param employerAddress - Stellar account ID of the employer
 * @returns Query result with vault data, loading state, and error
 */
export const useVaultData = (employerAddress: string | undefined) => {
  return useQuery({
    queryKey: CACHE_KEYS.vaultData(employerAddress || ""),
    queryFn: async () => {
      if (!employerAddress) return [];
      const data = await getAllVaultData(DEFAULT_TOKENS);
      return data;
    },
    enabled: !!employerAddress,
    ...VAULT_QUERY_OPTIONS,
    select: (data) =>
      data.map((v: TokenVaultData) => ({
        tokenSymbol: v.tokenSymbol,
        balance: v.balance.toString(),
      })),
  });
};

/**
 * Fetches payroll streams for an employer with React Query caching.
 * 
 * @param employerAddress - Stellar account ID of the employer
 * @param options - Pagination options
 * @returns Query result with streams, loading state, and error
 */
export const useStreams = (
  employerAddress: string | undefined,
  options?: { offset?: number; limit?: number },
) => {
  return useQuery({
    queryKey: CACHE_KEYS.streams(employerAddress || ""),
    queryFn: async () => {
      if (!employerAddress) return [];
      
      const streamIds = await getStreamsByEmployer(
        employerAddress,
        options?.offset,
        options?.limit,
      );

      const streamResults = await Promise.all(
        streamIds.map((id) => getStreamById(employerAddress, id)),
      );

      const employerStreams: Stream[] = await Promise.all(
        streamIds
          .map((id, i) => ({
            id,
            stream: streamResults[i],
          }))
          .filter(
            (x): x is { id: bigint; stream: ContractStream } =>
              x.stream !== null,
          )
          .map(async ({ id, stream: s }) => {
            const streamId = id.toString();
            const tokenSymbol = await getTokenSymbol(employerAddress, s.token);

            const flowRate = (Number(s.rate) / STROOPS_PER_UNIT).toFixed(7);
            const totalAmount = (Number(s.total_amount) / STROOPS_PER_UNIT).toFixed(2);
            const totalStreamed = (
              Number(s.withdrawn_amount) / STROOPS_PER_UNIT
            ).toFixed(2);

            const startDate = new Date(Number(s.start_ts) * 1000)
              .toISOString()
              .split("T")[0];
            const endDate = new Date(Number(s.end_ts) * 1000)
              .toISOString()
              .split("T")[0];

            let status: "active" | "completed" | "cancelled";
            switch (s.status) {
              case 0:
                status = "active";
                break;
              case 1:
                status = "cancelled";
                break;
              case 2:
                status = "completed";
                break;
              default:
                status = "active";
            }

            return {
              id: streamId,
              employeeName: `Worker ${streamId.slice(0, 8)}`,
              employeeAddress: s.worker,
              flowRate,
              tokenSymbol,
              startDate,
              endDate,
              totalAmount,
              totalStreamed,
              status,
            };
          }),
      );

      return employerStreams;
    },
    enabled: !!employerAddress,
    ...VAULT_QUERY_OPTIONS,
  });
};

/**
 * Fetches a single stream by ID with React Query caching.
 * 
 * @param employerAddress - Stellar account ID of the employer
 * @param streamId - Stream ID to fetch
 * @returns Query result with stream data
 */
export const useStream = (employerAddress: string | undefined, streamId: string | undefined) => {
  return useQuery({
    queryKey: CACHE_KEYS.stream(employerAddress || "", streamId || ""),
    queryFn: async () => {
      if (!employerAddress || !streamId) return null;
      return getStreamById(employerAddress, BigInt(streamId));
    },
    enabled: !!employerAddress && !!streamId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * Hook for accessing the query client to manually invalidate queries.
 */
export const usePayrollQueryClient = () => {
  const queryClient = useQueryClient();
  
  const invalidateVaultData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["vault"] });
  }, [queryClient]);

  const invalidateStreams = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["streams"] });
  }, [queryClient]);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["vault"] });
    queryClient.invalidateQueries({ queryKey: ["streams"] });
  }, [queryClient]);

  return {
    queryClient,
    invalidateVaultData,
    invalidateStreams,
    invalidateAll,
  };
};

/**
 * Combined hook for employer payroll dashboard.
 * Aggregates vault balances and streams data with unified loading/error states.
 *
 * @param employerAddress - Stellar account ID of the employer
 * @returns Combined payroll data with loading state and refresh function
 */
export const usePayroll = (employerAddress: string | undefined) => {
  const vaultQuery = useVaultData(employerAddress);
  const streamsQuery = useStreams(employerAddress);
  const { invalidateAll } = usePayrollQueryClient();

  return {
    streams: streamsQuery.data || [],
    treasuryBalances: vaultQuery.data || [],
    isLoading: vaultQuery.isLoading || streamsQuery.isLoading,
    error: vaultQuery.error || streamsQuery.error,
    refreshData: invalidateAll,
  };
};
