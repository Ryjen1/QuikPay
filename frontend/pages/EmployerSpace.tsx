import { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { usePayroll } from "../hooks/usePayroll";
import { buildDepositTx, PAYROLL_VAULT_CONTRACT_ID } from "../contracts/payroll_vault";
import { submitAndAwaitTx } from "../contracts/payroll_stream";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { StatCard } from "../components/ui/stat-card";
import { ErrorMessage } from "../components/ErrorMessage";
import { formatNumber } from "../util/formatters";
import { stellarNetwork } from "../contracts/util";

export default function EmployerSpace() {
  const { address, signTransaction } = useWallet();
  const { streams, treasuryBalances, isLoading, error, refreshData } = usePayroll(address);
  
  const [depositAmount, setDepositAmount] = useState("");
  const [workerAddress, setWorkerAddress] = useState("");
  const [rate, setRate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!address) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-white pt-24 pb-12 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-[var(--accent-blue)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[var(--accent-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)]">Wallet Required</h3>
            <p className="text-[var(--text-tertiary)]">Connect your wallet to access the Employer Portal</p>
            <p className="text-xs text-[var(--text-muted)]">Network: <span className="text-[var(--accent-teal)]">{stellarNetwork}</span></p>
          </CardContent>
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
        throw new Error("Treasury vault contract ID not configured");
      }

      const amountInStroops = BigInt(Math.floor(amount * 1e7));
      const { preparedXdr } = await buildDepositTx(address, "", amountInStroops);
      const signResult = await signTransaction(preparedXdr);
      const signedXdr = typeof signResult === "string" ? signResult : signResult.signedTxXdr;
      const txHash = await submitAndAwaitTx(signedXdr);

      setSuccess(`Deposit successful! Transaction: ${txHash.slice(0, 16)}...`);
      setDepositAmount("");
      setTimeout(() => refreshData(), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Deposit failed";
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

      setSuccess(`Stream setup ready! Worker: ${workerAddress.slice(0, 10)}... (Integration coming soon)`);
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

  const totalBalance = treasuryBalances.reduce((sum, b) => sum + parseFloat(b.balance || "0"), 0);
  const activeStreamsCount = streams.filter(s => s.status === "active").length;
  const totalStreamed = streams.reduce((sum, s) => sum + parseFloat(s.totalStreamed || "0"), 0);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-white pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-[var(--text-primary)]">Employer Workspace</h1>
          <p className="text-lg text-[var(--text-secondary)]">Manage your treasury and wage streams</p>
          <p className="text-sm text-[var(--text-muted)]">
            Network: <span className="text-[var(--accent-teal)] font-medium">{stellarNetwork}</span>
          </p>
        </div>

        {/* Alerts */}
        {submitError && (
          <div className="p-4 bg-[var(--accent-rose)]/10 border border-[var(--accent-rose)]/30 rounded-lg text-[var(--accent-rose)]">
            {submitError}
          </div>
        )}
        {error && <ErrorMessage error={error.message || String(error)} />}
        {success && (
          <div className="p-4 bg-[var(--accent-teal)]/10 border border-[var(--accent-teal)]/30 rounded-lg text-[var(--accent-teal)]">
            {success}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Treasury Balance"
            value={formatNumber(totalBalance, 2, 2)}
            unit="XLM"
            trend="+12.5%"
            trendDirection="up"
          />
          <StatCard
            label="Active Streams"
            value={activeStreamsCount}
            trend="+2 this week"
            trendDirection="up"
          />
          <StatCard
            label="Total Streamed"
            value={formatNumber(totalStreamed, 2, 2)}
            unit="XLM"
            trend="+8.2%"
            trendDirection="up"
          />
          <StatCard
            label="Monthly Burn"
            value="15,000"
            unit="XLM"
            trend="-3.1%"
            trendDirection="down"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Treasury Management */}
          <div className="space-y-6">
            {/* Deposit Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[var(--accent-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Deposit to Treasury
                </CardTitle>
                <CardDescription>Add funds to your payroll vault</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDeposit} className="space-y-4">
                  <Input
                    label="Amount (XLM)"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    helperText="Minimum deposit: 10 XLM"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    loading={isSubmitting}
                    disabled={!depositAmount || isSubmitting}
                  >
                    Deposit to Treasury
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Token Balances */}
            <Card>
              <CardHeader>
                <CardTitle>Token Balances</CardTitle>
                <CardDescription>Current treasury holdings</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-sm text-[var(--text-tertiary)]">Loading...</p>
                ) : treasuryBalances.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-[var(--primary-700)] rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-sm text-[var(--text-tertiary)]">No balances yet</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Make your first deposit</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {treasuryBalances.map((b) => (
                      <div key={b.tokenSymbol} className="flex justify-between items-center p-4 bg-[var(--primary-700)] rounded-lg">
                        <span className="text-sm font-medium text-[var(--text-secondary)]">{b.tokenSymbol}</span>
                        <span className="font-mono text-lg font-semibold text-[var(--accent-teal)]">
                          {formatNumber(parseFloat(b.balance) || 0, 2, 2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Create Stream */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[var(--accent-teal)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Create Wage Stream
                </CardTitle>
                <CardDescription>Set up a new payroll stream for a worker</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSetupAccrual} className="space-y-4">
                  <Input
                    label="Worker Address"
                    type="text"
                    placeholder="GXXX..."
                    value={workerAddress}
                    onChange={(e) => setWorkerAddress(e.target.value)}
                    helperText="Stellar public key of the worker"
                  />
                  <Input
                    label="Rate (XLM/second)"
                    type="number"
                    step="0.0001"
                    placeholder="0.001"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    helperText="Wage accrual rate per second"
                  />
                  <Input
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <Input
                    label="End Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <Button
                    type="submit"
                    variant="success"
                    fullWidth
                    loading={isSubmitting}
                    disabled={!workerAddress || !rate || !startDate || !endDate || isSubmitting}
                  >
                    Create Stream
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Active Streams Table */}
        <Card>
          <CardHeader>
            <CardTitle>Active Streams</CardTitle>
            <CardDescription>Manage your payroll streams</CardDescription>
          </CardHeader>
          <CardContent>
            {streams.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[var(--primary-700)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No streams yet</h3>
                <p className="text-sm text-[var(--text-tertiary)]">Create your first wage stream to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border-primary)]">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Worker</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Rate</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Streamed</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {streams.map((stream) => (
                      <tr key={stream.id} className="border-b border-[var(--border-secondary)] hover:bg-[var(--primary-700)] transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-mono text-sm text-[var(--text-primary)]">
                            {stream.employeeAddress.slice(0, 8)}...{stream.employeeAddress.slice(-4)}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-[var(--text-secondary)]">
                          {stream.flowRate} {stream.tokenSymbol}/sec
                        </td>
                        <td className="py-4 px-4 text-sm font-semibold text-[var(--accent-teal)]">
                          {stream.totalStreamed} {stream.tokenSymbol}
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={stream.status === "active" ? "success" : stream.status === "cancelled" ? "error" : "neutral"}>
                            {stream.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
