/**
 * payroll_vault.ts
 * ─────────────────
 * Frontend bindings for the PayrollVault Soroban contract.
 *
 * Exports
 * ───────
 * • PAYROLL_VAULT_CONTRACT_ID   – contract address from env
 * • TokenVaultData              – shape of vault data for a token
 * • getVaultBalance             – reads total balance for a token
 * • getVaultLiability           – reads total liability for a token
 * • getVaultAvailableBalance    – reads available balance (balance - liability)
 * • getVaultData                – reads complete vault data for a token
 * • getAllVaultData             – reads vault data for all configured tokens
 * • getActualVaultBalance       – reads actual account balance from Horizon (NEW)
 */

import {
  Contract,
  rpc as SorobanRpc,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  Address,
  Operation,
  Asset,
  Horizon,
} from "@stellar/stellar-sdk";
import { rpcUrl, networkPassphrase, horizonUrl } from "./util";

export const VAULT_ACCOUNT = (
  import.meta.env.VITE_VAULT_ACCOUNT as string | undefined
)?.trim() ?? "";

// ─── Contract ID ──────────────────────────────────────────────────────────────

export const PAYROLL_VAULT_CONTRACT_ID: string =
  (
    import.meta.env.VITE_PAYROLL_VAULT_CONTRACT_ID as string | undefined
  )?.trim() ?? "";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Shape of vault data for a specific token as returned by the contract.
 */
export interface TokenVaultData {
  /** Token contract address (or empty string for native XLM) */
  token: string;
  /** Token symbol (e.g., "XLM", "USDC") */
  tokenSymbol: string;
  /** Total balance in stroops (smallest unit) */
  balance: bigint;
  /** Total liability (committed to streams) in stroops */
  liability: bigint;
  /** Available balance (balance - liability) in stroops */
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

function getHorizonServer(): Horizon.Server {
  return new Horizon.Server(horizonUrl);
}

/**
 * Converts a token string to a ScVal suitable for the contract.
 * Empty string → native XLM address bytes.
 */
function tokenToScVal(token: string): ReturnType<typeof nativeToScVal> {
  if (!token || token === "native") {
    return nativeToScVal(null, { type: "address" });
  }
  return new Address(token).toScVal();
}

/**
 * Simulates a read-only contract call.
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
 * Builds a deposit transaction.
 * Sends XLM from user → vault G... account via classic payment.
 * This is separate from the contract call (which records accounting).
 *
 * Flow: User sends XLM via classic payment → vault account holds XLM.
 * The backend will later call contract.deposit() to record the accounting.
 */
export async function buildDepositTx(
  fromAddress: string,
  _token: string,
  amount: bigint,
): Promise<{ preparedXdr: string }> {
  if (!VAULT_ACCOUNT) {
    throw new Error("VITE_VAULT_ACCOUNT is not set.");
  }

  const server = getRpcServer();
  const account = await server.getAccount(fromAddress);

  // Convert stroops to XLM (divide by 10^7)
  // Stellar SDK expects amount as XLM string, not stroops
  const amountInXLM = (Number(amount) / 1e7).toFixed(7);

  // Single classic payment operation only
  // (Soroban prepareTransaction only allows one op per tx)
  const tx = new TransactionBuilder(account, {
    fee: "200000",
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: VAULT_ACCOUNT, // G... vault address
        asset: Asset.native(),
        amount: amountInXLM, // Must be XLM as decimal string
        source: fromAddress,
      }),
    )
    .setTimeout(60)
    .build();

  // Prepare without Soroban wrapping (classic tx)
  return { preparedXdr: tx.toXDR() };
}

// ─── getActualVaultBalance ──────────────────────────────────────────────────

/**
 * Gets the actual XLM balance of the vault account from Horizon.
 * This is a workaround until the backend service updates the contract.
 * 
 * @returns Balance in stroops (1 XLM = 10^7 stroops)
 */
export async function getActualVaultBalance(): Promise<bigint> {
  if (!VAULT_ACCOUNT) {
    return 0n;
  }

  try {
    const server = getHorizonServer();
    const account = await server.loadAccount(VAULT_ACCOUNT);
    
    // Find XLM balance
    const xlmBalance = account.balances.find(
      (b) => b.asset_type === "native"
    );
    
    if (!xlmBalance || xlmBalance.asset_type !== "native") {
      return 0n;
    }
    
    // Convert XLM to stroops
    const balanceInStroops = BigInt(Math.floor(parseFloat(xlmBalance.balance) * 1e7));
    return balanceInStroops;
  } catch (error) {
    console.error("Error fetching vault balance from Horizon:", error);
    return 0n;
  }
}

// ─── getVaultBalance ─────────────────────────────────────────────────────────

/**
 * Calls `get_balance` on the PayrollVault contract to get the total balance
 * for a specific token.
 *
 * @param token Token contract address (or empty string for XLM)
 * @returns Balance in stroops, or null if error
 */
export async function getVaultBalance(token: string): Promise<bigint | null> {
  if (!PAYROLL_VAULT_CONTRACT_ID) return null;

  const contract = new Contract(PAYROLL_VAULT_CONTRACT_ID);
  const balance = await simulateContractRead<bigint>(
    PAYROLL_VAULT_CONTRACT_ID,
    contract.call("get_balance", tokenToScVal(token)),
  );

  return balance;
}

// ─── getVaultLiability ───────────────────────────────────────────────────────

/**
 * Calls `get_liability` on the PayrollVault contract to get the total liability
 * (amount committed to active streams) for a specific token.
 *
 * @param token Token contract address (or empty string for XLM)
 * @returns Liability in stroops, or null if error
 */
export async function getVaultLiability(token: string): Promise<bigint | null> {
  if (!PAYROLL_VAULT_CONTRACT_ID) return null;

  const contract = new Contract(PAYROLL_VAULT_CONTRACT_ID);
  const liability = await simulateContractRead<bigint>(
    PAYROLL_VAULT_CONTRACT_ID,
    contract.call("get_liability", tokenToScVal(token)),
  );

  return liability;
}

// ─── getVaultAvailableBalance ────────────────────────────────────────────────

/**
 * Calculates available balance (balance - liability) for a token.
 *
 * @param token Token contract address (or empty string for XLM)
 * @returns Available balance in stroops, or null if error
 */
export async function getVaultAvailableBalance(
  token: string,
): Promise<bigint | null> {
  const balance = await getVaultBalance(token);
  const liability = await getVaultLiability(token);

  if (balance === null || liability === null) return null;

  return balance - liability;
}

// ─── getVaultData ────────────────────────────────────────────────────────────

/**
 * Fetches complete vault data for a single token.
 *
 * @param token Token contract address (or empty string for XLM)
 * @param tokenSymbol Human-readable token symbol
 * @param monthlyBurnRate Estimated monthly burn rate in stroops
 * @returns Complete vault data or null if error
 */
export async function getVaultData(
  token: string,
  tokenSymbol: string,
  monthlyBurnRate: bigint,
): Promise<TokenVaultData | null> {
  const balance = await getVaultBalance(token);
  const liability = await getVaultLiability(token);

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
 * Fetches vault data for multiple tokens.
 * WORKAROUND: For XLM, reads actual balance from Horizon instead of contract.
 *
 * @param tokens Array of token configurations
 * @returns Array of vault data for each token
 */
export async function getAllVaultData(
  tokens: Array<{
    token: string;
    tokenSymbol: string;
    monthlyBurnRate: bigint;
  }>,
): Promise<TokenVaultData[]> {
  const results = await Promise.all(
    tokens.map(async ({ token, tokenSymbol, monthlyBurnRate }) => {
      // WORKAROUND: For XLM (empty token), read actual balance from Horizon
      if (!token || token === "" || token === "native") {
        const actualBalance = await getActualVaultBalance();
        return {
          token: "",
          tokenSymbol: "XLM",
          balance: actualBalance,
          liability: 0n,
          available: actualBalance,
          monthlyBurnRate,
          runwayDays: monthlyBurnRate > 0n
            ? Number(actualBalance / (monthlyBurnRate / 30n))
            : Infinity,
        };
      }
      
      // For other tokens, use contract
      return getVaultData(token, tokenSymbol, monthlyBurnRate);
    }),
  );

  return results.filter((r): r is TokenVaultData => r !== null);
}
