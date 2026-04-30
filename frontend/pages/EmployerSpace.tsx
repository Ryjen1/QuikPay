import { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { usePayroll } from "../hooks/usePayroll";
import { buildDepositTx, PAYROLL_VAULT_CONTRACT_ID } from "../contracts/payroll_vault";
import { submitAndAwaitTx } from "../contracts/payroll_stream";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ErrorMessage } from "../components/ErrorMessage";
import { formatNumber } from "../util/formatters";
import { stellarNetwork } from "../contracts/util";

export default function EmployerSpace() {
  const { address, signTransaction } = useWallet();
  const { streams, treasuryBalances, isLoading, error, refreshData } = usePayroll(address);
  
  const [depositAmount, setDepositAmount] = useState("");
  const [depositToken, setDepositToken] = useState("native");
  const [workerAddress, setWorkerAddress] = useState("");
  const [rate, setRate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!address) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white pt-24 pb-12 flex items-center justify-center">
        <Card className="max-w-md">
          <div className="p-6 text-center">
            <p className="text-slate-400 mb-4">Connect your wallet to access the Employer Portal</p>
            <p className="text-xs text-slate-500">Network: {stellarNetwork}</p>
          </div>
        </Card>
      </div>
    );
  }

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const amount = parseFloat(depositAmount);
      if (!amount || amount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      if (!PAYROLL_VAULT_CONTRACT_ID) {
        throw new Error("Treasury vault contract ID not configured. Please set VITE_PAYROLL_VAULT_CONTRACT_ID in .env");
      }

      // Convert amount to stroops (Stellar uses 7 decimal places)
      const amountInStroops = BigInt(Math.floor(amount * 1e7));

      console.log("Building deposit transaction...", { address, amount: amountInStroops.toString() });
      
      // Build the deposit transaction (simplified - no token parameter)
      const { preparedXdr } = await buildDepositTx(address, "", amountInStroops);
      
      console.log("Requesting wallet signature...");
      // Sign with wallet
      const signResult = await signTransaction(preparedXdr);
      const signedXdr = typeof signResult === "string" ? signResult : signResult.signedTxXdr;
      
      console.log("Submitting transaction...");
      // Submit to network
      const txHash = await submitAndAwaitTx(signedXdr);

      setSuccess(`✅ Deposit successful!\nTransaction: ${txHash.slice(0, 16)}...\nAmount: ${amount} XLM`);
      setDepositAmount("");
      
      // Refresh treasury balance
      setTimeout(() => {
        refreshData();
      }, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Deposit failed";
      console.error("Deposit error:", err);
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetupAccrual = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      if (!workerAddress || !rate || !startDate || !endDate) {
        throw new Error("Please fill in all fields");
      }

      // TODO: Integrate with PayrollStream contract when ready
      setSuccess(`✅ Stream setup ready!\nWorker: ${workerAddress.slice(0, 10)}...\nRate: ${rate} ${depositToken}/sec\n\n(Full integration coming soon)`);
      setWorkerAddress("");
      setRate("");
      setStartDate("");
      setEndDate("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Stream creation failed";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2">Employer Workspace</h1>
          <p className="text-slate-400">Manage your treasury and set up wage accrual contracts on-chain.</p>
          <p className="text-xs text-slate-600 mt-2">Network: <span className="text-[#00ff88]">{stellarNetwork}</span></p>
        </div>

        {submitError && <ErrorMessage error={submitError} />}
        {error && <ErrorMessage error={error} />}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 whitespace-pre-line">
            {success}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Treasury Status */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#00ff88]">🏦</span>
              Treasury Status
            </h2>

            {isLoading ? (
              <p className="text-slate-400 text-sm">Loading...</p>
            ) : treasuryBalances.length === 0 ? (
              <p className="text-sm text-slate-400">No balances yet. Make your first deposit.</p>
            ) : (
              <div className="space-y-3">
                {treasuryBalances.map((b) => (
                  <div key={b.tokenSymbol} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-slate-400 font-medium">{b.tokenSymbol}</span>
                    <span className="font-mono text-[#00ff88]">{formatNumber(parseFloat(b.balance) || 0, 2, 2)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-sm text-slate-500">Active Streams: {streams.length}</p>
            </div>
          </div>

          {/* Deposit Panel */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-6">Deposit to Treasury</h2>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-2">Token: XLM</p>
                <p className="text-xs text-slate-500 mb-4">Native XLM deposits to treasury vault</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Amount ({depositToken === "native" ? "XLM" : depositToken})</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]/50"
                  placeholder="e.g. 100"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !depositAmount}
                className="w-full"
              >
                {isSubmitting ? "Processing..." : "💳 Deposit to Treasury"}
              </Button>
              <p className="text-xs text-slate-500 text-center">This will open your wallet to sign the transaction</p>
            </form>
          </div>
        </div>

        {/* Setup Accrual Panel */}
        <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#00ff88]/10 flex items-center justify-center text-[#00ff88]">⚡</span>
            Create Wage Stream
          </h2>

          <form onSubmit={handleSetupAccrual} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Worker Public Key</label>
              <input
                type="text"
                value={workerAddress}
                onChange={(e) => setWorkerAddress(e.target.value)}
                className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]/50 font-mono text-sm"
                placeholder="GXXX... (56 chars)"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Flow Rate ({depositToken === "native" ? "XLM" : depositToken}/sec)</label>
              <input
                type="number"
                step="0.0000001"
                min="0"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]/50 font-mono"
                placeholder="e.g. 0.001"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Start Date & Time</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]/50 [color-scheme:dark]"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">End Date & Time</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]/50 [color-scheme:dark]"
                required
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="md:col-span-2"
            >
              {isSubmitting ? "Creating..." : "⚡ Create Stream"}
            </Button>
          </form>
        </div>

        {/* Active Streams */}
        {streams.length > 0 && (
          <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-6">Active Streams ({streams.length})</h2>
            <div className="space-y-3">
              {streams.map((stream) => (
                <div key={stream.id} className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold">{stream.employeeName}</p>
                    <p className="text-xs text-slate-500 font-mono">{stream.employeeAddress}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#00ff88] font-mono text-sm">{stream.flowRate} {stream.tokenSymbol}/s</p>
                    <p className="text-xs text-slate-500 capitalize">{stream.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
