import { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useStreams } from "../hooks/useStreams";
import { useRealTimeEarnings } from "../hooks/useRealTimeEarnings";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { StatCard } from "../components/ui/stat-card";
import { ErrorMessage } from "../components/ErrorMessage";
import { formatNumber } from "../util/formatters";
import { stellarNetwork } from "../contracts/util";

export default function WorkerSpace() {
  const { address } = useWallet();
  const { streams, isLoading, error } = useStreams(address);
  const earnings = useRealTimeEarnings(streams, 100);
  
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  if (!address) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-white pt-24 pb-12 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-[var(--accent-teal)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[var(--accent-teal)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)]">Wallet Required</h3>
            <p className="text-[var(--text-tertiary)]">Connect your wallet to access the Worker Portal</p>
            <p className="text-xs text-[var(--text-muted)]">Network: <span className="text-[var(--accent-teal)]">{stellarNetwork}</span></p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleWithdraw = async (streamId: string) => {
    setWithdrawError(null);
    setWithdrawSuccess(null);
    setWithdrawing(streamId);

    try {
      const stream = streams.find((s) => s.id === streamId);
      if (!stream) {
        throw new Error("Stream not found");
      }

      if (stream.claimedAmount <= 0) {
        throw new Error("No earnings to withdraw yet");
      }

      setWithdrawSuccess(`Withdrawal ready! Stream: ${streamId} (Integration coming soon)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Withdrawal failed";
      setWithdrawError(msg);
    } finally {
      setWithdrawing(null);
    }
  };

  const totalEarned = streams.reduce((sum, s) => sum + (s.claimedAmount || 0), 0);
  const activeStreamsCount = streams.filter(s => s.status === 0).length; // 0 = active
  const avgDailyRate = totalEarned / 30; // Simplified calculation

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-white pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-[var(--text-primary)]">Worker Dashboard</h1>
          <p className="text-lg text-[var(--text-secondary)]">Track earnings and withdraw instantly</p>
        </div>

        {/* Alerts */}
        {withdrawError && (
          <div className="p-4 bg-[var(--accent-rose)]/10 border border-[var(--accent-rose)]/30 rounded-lg text-[var(--accent-rose)]">
            {withdrawError}
          </div>
        )}
        {error && <ErrorMessage error={String(error)} />}
        {withdrawSuccess && (
          <div className="p-4 bg-[var(--accent-teal)]/10 border border-[var(--accent-teal)]/30 rounded-lg text-[var(--accent-teal)]">
            {withdrawSuccess}
          </div>
        )}

        {/* Earnings Hero */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-blue)]/10 via-transparent to-[var(--accent-teal)]/10" />
          <CardContent className="relative p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
                  Current Earnings Available
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold text-[var(--text-primary)] font-mono">
                    {formatNumber(totalEarned, 3, 3)}
                  </span>
                  <span className="text-2xl font-medium text-[var(--text-secondary)]">XLM</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-[var(--accent-teal)]/10 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-[var(--accent-teal)] animate-pulse" />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="success" size="lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Withdraw All
              </Button>
              <Button variant="secondary" size="lg">
                Withdraw Partial
              </Button>
            </div>

            {/* Simple Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-tertiary)]">Accrual Progress</span>
                <span className="text-[var(--text-secondary)]">65%</span>
              </div>
              <div className="h-2 bg-[var(--primary-700)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-teal)] rounded-full transition-all duration-500"
                  style={{ width: '65%' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="Total Earned"
            value={formatNumber(totalEarned, 2, 2)}
            unit="XLM"
            trend="+15.2%"
            trendDirection="up"
          />
          <StatCard
            label="Active Streams"
            value={activeStreamsCount}
            trend="All active"
            trendDirection="neutral"
          />
          <StatCard
            label="Avg Daily Rate"
            value={formatNumber(avgDailyRate, 2, 2)}
            unit="XLM"
            trend="+5.3%"
            trendDirection="up"
          />
        </div>

        {/* Active Streams */}
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Active Streams</h2>
          
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center gap-2 text-[var(--text-tertiary)]">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading streams...
                </div>
              </CardContent>
            </Card>
          ) : streams.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-[var(--primary-700)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No active streams</h3>
                <p className="text-sm text-[var(--text-tertiary)]">You don't have any wage streams yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {streams.map((stream) => (
                <Card key={stream.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">Stream #{stream.id.slice(0, 8)}</CardTitle>
                        <CardDescription className="font-mono text-xs mt-1">
                          {stream.employerAddress.slice(0, 12)}...{stream.employerAddress.slice(-4)}
                        </CardDescription>
                      </div>
                      <Badge variant={stream.status === 0 ? "success" : "neutral"}>
                        {stream.status === 0 ? "active" : stream.status === 1 ? "cancelled" : "completed"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide mb-1">Rate</p>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {formatNumber(stream.flowRate || 0, 4, 4)} {stream.tokenSymbol}/sec
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide mb-1">Earned</p>
                        <p className="text-sm font-semibold text-[var(--accent-teal)]">
                          {formatNumber(stream.claimedAmount || 0, 2, 2)} {stream.tokenSymbol}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-[var(--text-tertiary)]">
                        <span>Available</span>
                        <span>{formatNumber(stream.claimedAmount || 0, 2, 2)} {stream.tokenSymbol}</span>
                      </div>
                      <div className="h-2 bg-[var(--primary-700)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[var(--accent-teal)] rounded-full"
                          style={{ width: `${Math.min((stream.claimedAmount / stream.totalAmount) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      loading={withdrawing === stream.id}
                      disabled={stream.claimedAmount <= 0 || withdrawing === stream.id}
                      onClick={() => handleWithdraw(stream.id)}
                    >
                      Withdraw
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
