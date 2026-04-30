import { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useStreams } from "../hooks/useStreams";
import { useRealTimeEarnings } from "../hooks/useRealTimeEarnings";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
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
      <div className="min-h-screen bg-[#0B0F19] text-white pt-24 pb-12 flex items-center justify-center">
        <Card className="max-w-md">
          <div className="p-6 text-center">
            <p className="text-slate-400 mb-4">Connect your wallet to access the Worker Portal</p>
            <p className="text-xs text-slate-500">Network: {stellarNetwork}</p>
          </div>
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

      // TODO: Integrate with PayrollStream contract when contract IDs are configured
      setWithdrawSuccess(`✅ Withdrawal ready!\nStream: ${streamId}\nAmount: ${formatNumber(stream.claimedAmount, 2, 2)} ${stream.tokenSymbol}`);
      
      // In production: call buildCancelStreamTx and submitAndAwaitTx
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Withdrawal failed";
      setWithdrawError(msg);
    } finally {
      setWithdrawing(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-sm font-bold uppercase tracking-widest text-[#00ff88] mb-4 border border-[#00ff88]/30 px-4 py-1.5 rounded-full inline-block">
            Worker Portal
          </h1>
          <p className="text-slate-400">Your contracted wages are accruing in real-time.</p>
          <p className="text-xs text-slate-600 mt-2">Network: <span className="text-[#00ff88]">{stellarNetwork}</span></p>
        </div>

        {withdrawError && <ErrorMessage error={withdrawError} />}
        {error && <ErrorMessage error={error} />}
        {withdrawSuccess && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 max-w-2xl mx-auto whitespace-pre-line">
            {withdrawSuccess}
          </div>
        )}

        {isLoading ? (
          <div className="text-center text-slate-400">Loading your streams...</div>
        ) : error ? (
          <div className="text-center">
            <ErrorMessage error={error} />
          </div>
        ) : streams.length === 0 ? (
          <Card className="max-w-lg mx-auto">
            <div className="p-6 text-center">
              <p className="text-slate-400">No active wage streams yet.</p>
              <p className="text-sm text-slate-500 mt-2">Ask your employer to create one for you.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Main Earnings Display */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center max-w-2xl mx-auto backdrop-blur-xl shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00ff88] to-transparent opacity-50 rounded-t-3xl" />

              <p className="text-slate-400 font-medium mb-4">Total Earned Balance</p>

              <div className="font-mono text-6xl md:text-7xl font-bold tracking-tighter text-white mb-2 flex justify-center items-baseline gap-2">
                {formatNumber(earnings.totalEarned || 0, 2, 6)} 
                <span className="text-2xl text-[#00ff88]">XLM</span>
              </div>

              <p className="text-sm text-slate-500 font-mono mb-8">
                {streams.length} active stream{streams.length !== 1 ? "s" : ""}
              </p>

              {/* Earnings Stats */}
              <div className="grid grid-cols-3 gap-4 py-6 border-t border-white/10">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Per Hour</p>
                  <p className="text-[#00ff88] font-mono">{formatNumber(earnings.hourlyRate || 0, 2, 4)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Per Day</p>
                  <p className="text-[#00ff88] font-mono">{formatNumber(earnings.dailyRate || 0, 2, 4)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Active Count</p>
                  <p className="text-[#00ff88] font-mono">{earnings.activeStreamsCount || 0}</p>
                </div>
              </div>
            </div>

            {/* Individual Streams */}
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-xl font-semibold">Your Streams</h2>
              {streams.map((stream) => (
                <div key={stream.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold mb-1">{stream.employerName}</p>
                      <p className="text-sm text-slate-500 font-mono">{stream.id}</p>
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-slate-500 text-xs">Flow Rate</p>
                          <p className="text-[#00ff88] font-mono">{formatNumber(stream.flowRate || 0, 2, 7)} {stream.tokenSymbol}/s</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Claimed</p>
                          <p className="text-[#00ff88] font-mono">{formatNumber(stream.claimedAmount || 0, 2, 2)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Total</p>
                          <p className="text-[#00ff88] font-mono">{formatNumber(stream.totalAmount || 0, 2, 2)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Status</p>
                          <p className="text-[#00ff88] font-mono capitalize">{stream.status === 0 ? "Active" : stream.status === 1 ? "Canceled" : "Completed"}</p>
                        </div>
                      </div>
                    </div>

                    {stream.status === 0 && (stream.claimedAmount || 0) > 0 && (
                      <Button
                        onClick={() => handleWithdraw(stream.id)}
                        disabled={withdrawing === stream.id}
                        className="md:w-32"
                      >
                        {withdrawing === stream.id ? "Processing..." : "Withdraw"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 max-w-2xl mx-auto p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-sm">
          <p className="font-semibold mb-2">📝 Development Mode</p>
          <p>Full contract integration coming soon. Real earnings calculation is working - contracts ready when you deploy to testnet.</p>
        </div>
      </div>
    </div>
  );
}
