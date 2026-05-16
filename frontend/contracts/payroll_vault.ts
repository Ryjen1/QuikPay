/**
 * payroll_vault.ts
 * ─────────────────
 * Frontend bindings for the PayrollVault Soroban contract.
 *
 * The vault holds real XLM (custodied by the contract via the native XLM
 * Stellar Asset Contract) and maintains a separate, per-employer balance.
 * Each connected wallet has its own balance + liability inside the contract:
 *
 *   • deposit(from, amount)     – user signs; real XLM moves user → contract
 *   • withdraw(employer, amount) – user signs; real XLM moves contract → user
 *                                   (only available portion can be withdrawn)
 *
 * Exports
 * ───────
 * • PAYROLL_VAULT_CONTRACT_ID   – contract address from env
 * • TokenVaultData              – shape of vault data for a token (per employer)
 * • buildDepositTx              – build a Soroban deposit invocation
 * • buildWithdrawTx             – build a Soroban withdraw invocation
 * • getVaultBalance             – reads employer's balance (stroops)
 * • getVaultLiability           – reads employer's liability (stroops)
 * • getVaultAvailableBalance    – reads employer's available balance
 * • getEmployerVaultData        – reads complete per-employer vault data
 * • getAllVaultData             – reads vault data for a single employer
 *                                 across the configured token list (XLM only
 *                                 in the current contract)
 */

import {
  Contract,
  rpc as SorobanRpc,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  Address,
} from "@stellar/stellar-sdk";
import { rpcUrl, networkPassphrase } from "./util";

// ─── Contract ID ──────────────────────────────────────────────────────────────

export const PAYROLL_VAULT_CONTRACT_ID: string =
  (
    import.meta.env.VITE_PAYROLL_VAULT_CONTRACT_ID as string | undefined
  )?.trim() ?? "";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Per-employer vault data for a specific token.
 */
export interface TokenVaultData {
  /** Token contract address (or empty string for native XLM) */
  token: string;
  /** Token symbol (e.g., "XLM", "USDC") */
  tokenSymbol: string;
  /** Employer's deposited balance in stroops */
  balance: bigint;
  /** Employer's liability (committed to streams) in stroops */
  liability: bigint;
  /** Employer's available balance (balance - liability) in stroops */
  available: bigint;
  /** Monthly burn rate in stroops (estimated) */
  monthlyBurnRate: bigint;
  /** Runway in days (how long available balance will last) */
  runwayDays: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRpcServer(): SorobanRpc.Server {
  return new SorobanRpc.Server(rpcUrl, { allowHttp: true });
}

/**
 * Simulates a read-only contract call, using `sourceAddress` as the source.
 * Falls back to the contract address itself if the user account isn't on chain.
 */
async function simulateContractRead<T>(
  sourceAddress: string,
  operation: ReturnType<Contract["call"]>,
): Promise<T | null> {
  const server = getRpcServer();

  let source = await server.getAccount(sourceAddress).catch(() => null);
  if (!source && PAYROLL_VAULT_CONTRACT_ID) {
    source = await server
      .getAccount(PAYROLL_VAULT_CONTRACT_ID)
      .catch(() => null);
  }
  if (!source) return null;

  const tx = new TransactionBuilder(source, { fee: "100", networkPassphrase })
    .addOperation(operation)
    .setTimeout(10)
    .build();

  const response = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(response)) return null;

  const retval = (response as SorobanRpc.Api.SimulateTransactionSuccessResponse)
    .result?.retval;
  if (!retval) return null;

  const native = scValToNative(retval) as T | undefined;
  return native ?? null;
}

// ─── buildDepositTx ─────────────────────────────────────────────────────────

/**
 * Builds a `deposit(from, amount)` Soroban invocation. The user signs this
 * transaction; on submission the vault contract transfers `amount` stroops of
 * native XLM from `from` into the contract via the native XLM SAC, and
 * credits the user's per-employer balance.
 */
export async function buildDepositTx(
  fromAddress: string,
  amount: bigint,
): Promise<{ preparedXdr: string }> {
  if (!PAYROLL_VAULT_CONTRACT_ID) {
    throw new Error("VITE_PAYROLL_VAULT_CONTRACT_ID is not set.");
  }
  if (amount <= 0n) {
    throw new Error("Deposit amount must be positive.");
  }

  const server = getRpcServer();
  const account = await server.getAccount(fromAddress);
  const contract = new Contract(PAYROLL_VAULT_CONTRACT_ID);

  const tx = new TransactionBuilder(account, {
    fee: "1000000",
    networkPassphrase,
  })
    .addOperation(
      contract.call(
        "deposit",
        new Address(fromAddress).toScVal(),
        nativeToScVal(amount, { type: "i128" }),
      ),
    )
    .setTimeout(60)
    .build();

  const prepared = await server.prepareTransaction(tx);
  return { preparedXdr: prepared.toXDR() };
}

// ─── buildWithdrawTx ────────────────────────────────────────────────────────

/**
 * Builds a `withdraw(employer, amount)` Soroban invocation. The user signs
 * this transaction; on submission the vault transfers `amount` stroops of
 * native XLM back from the contract to `employer` (must not exceed
 * `balance - liability`).
 */
export async function buildWithdrawTx(
  employerAddress: string,
  amount: bigint,
): Promise<{ preparedXdr: string }> {
  if (!PAYROLL_VAULT_CONTRACT_ID) {
    throw new Error("VITE_PAYROLL_VAULT_CONTRACT_ID is not set.");
  }
  if (amount <= 0n) {
    throw new Error("Withdraw amount must be positive.");
  }

  const server = getRpcServer();
  const account = await server.getAccount(employerAddress);
  const contract = new Contract(PAYROLL_VAULT_CONTRACT_ID);

  const tx = new TransactionBuilder(account, {
    fee: "1000000",
    networkPassphrase,
  })
    .addOperation(
      contract.call(
        "withdraw",
        new Address(employerAddress).toScVal(),
        nativeToScVal(amount, { type: "i128" }),
      ),
    )
    .setTimeout(60)
    .build();

  const prepared = await server.prepareTransaction(tx);
  return { preparedXdr: prepared.toXDR() };
}

// ─── getVaultBalance ─────────────────────────────────────────────────────────

/**
 * Calls `get_balance(employer)` on the PayrollVault contract.
 *
 * @param employer  Employer's Stellar account ID (G…)
 * @returns Balance in stroops, or null on error
 */
export async function getVaultBalance(
  employer: string,
): Promise<bigint | null> {
  if (!PAYROLL_VAULT_CONTRACT_ID || !employer) return null;

  const contract = new Contract(PAYROLL_VAULT_CONTRACT_ID);
  const balance = await simulateContractRead<bigint>(
    employer,
    contract.call("get_balance", new Address(employer).toScVal()),
  );

  return balance;
}

// ─── getVaultLiability ───────────────────────────────────────────────────────

/**
 * Calls `get_liability(employer)` on the PayrollVault contract.
 */
export async function getVaultLiability(
  employer: string,
): Promise<bigint | null> {
  if (!PAYROLL_VAULT_CONTRACT_ID || !employer) return null;

  const contract = new Contract(PAYROLL_VAULT_CONTRACT_ID);
  const liability = await simulateContractRead<bigint>(
    employer,
    contract.call("get_liability", new Address(employer).toScVal()),
  );

  return liability;
}

// ─── getVaultAvailableBalance ────────────────────────────────────────────────

/**
 * Calls `get_available(employer)` on the PayrollVault contract.
 */
export async function getVaultAvailableBalance(
  employer: string,
): Promise<bigint | null> {
  if (!PAYROLL_VAULT_CONTRACT_ID || !employer) return null;

  const contract = new Contract(PAYROLL_VAULT_CONTRACT_ID);
  const available = await simulateContractRead<bigint>(
    employer,
    contract.call("get_available", new Address(employer).toScVal()),
  );

  return available;
}

// ─── getEmployerVaultData ────────────────────────────────────────────────────

/**
 * Fetches complete vault data for a single employer + token.
 * Only native XLM is currently held by the contract.
 */
export async function getEmployerVaultData(
  employer: string,
  token: string,
  tokenSymbol: string,
  monthlyBurnRate: bigint,
): Promise<TokenVaultData | null> {
  const balance = await getVaultBalance(employer);
  const liability = await getVaultLiability(employer);

  if (balance === null || liability === null) return null;

  const available = balance - liability;
  const runwayDays =
    monthlyBurnRate > 0n
      ? Number(available / (monthlyBurnRate / 30n))
      : Infinity;

  return {
    token,
    tokenSymbol,
    balance,
    liability,
    available,
    monthlyBurnRate,
    runwayDays,
  };
}

// ─── getAllVaultData ─────────────────────────────────────────────────────────

/**
 * Fetches per-employer vault data across a list of token configurations.
 * The current contract only supports the asset it was initialized with
 * (native XLM); non-native tokens return zero balances.
 */
export async function getAllVaultData(
  employer: string,
  tokens: Array<{
    token: string;
    tokenSymbol: string;
    monthlyBurnRate: bigint;
  }>,
): Promise<TokenVaultData[]> {
  if (!employer) return [];

  const results = await Promise.all(
    tokens.map(async ({ token, tokenSymbol, monthlyBurnRate }) => {
      // Only XLM is held by the vault; other tokens return a zero entry
      if (!token || token === "" || token === "native") {
        const data = await getEmployerVaultData(
          employer,
          "",
          tokenSymbol || "XLM",
          monthlyBurnRate,
        );
        return data;
      }
      return {
        token,
        tokenSymbol,
        balance: 0n,
        liability: 0n,
        available: 0n,
        monthlyBurnRate,
        runwayDays: Infinity,
      } satisfies TokenVaultData;
    }),
  );

  return results.filter((r): r is TokenVaultData => r !== null);
}
