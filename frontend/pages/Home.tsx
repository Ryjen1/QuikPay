import { NavLink } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0B0F19] pt-24 text-white selection:bg-[#00ff88] selection:text-black">
      <div className="max-w-7xl mx-auto px-4 py-20 lg:py-32">
        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#00ff88] text-sm font-semibold uppercase tracking-wider mb-8">
            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
            Live on Stellar Testnet
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter leading-tight mb-8">
            Wage Accrual. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff88] to-emerald-500">
              On-Demand Claims.
            </span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl leading-relaxed mb-12">
            QuikPay eliminates the 30-day wait for the monthly payday. Mathematically sound time-based wage accrual deployed autonomously on the Stellar blockchain. Workers withdraw up to their earned limits at any given second.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <NavLink
              to="/employer"
              className="px-8 py-4 rounded-xl bg-[#00ff88] text-black font-bold text-lg hover:bg-[#00cf6d] transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_-10px_rgba(0,255,136,0.5)]"
            >
              Setup Employer Vault
            </NavLink>
            <NavLink
              to="/worker"
              className="px-8 py-4 rounded-xl bg-white/5 text-white font-bold text-lg hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-2"
            >
              Worker Portal
            </NavLink>
          </div>
        </div>

        <div className="mt-32 grid md:grid-cols-3 gap-8 border-t border-white/10 pt-16">
          <div className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-[#00ff88]/30 transition-colors">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-6 text-[#00ff88]">
              📈
            </div>
            <h3 className="text-xl font-bold mb-3">Time-Based Accrual</h3>
            <p className="text-slate-400 leading-relaxed">
              Employers deposit liquid funds. Wages mathematically unlock per second according to the contracted rate.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-[#00ff88]/30 transition-colors">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-6 text-[#00ff88]">
              ⚡
            </div>
            <h3 className="text-xl font-bold mb-3">On-Demand Withdrawals</h3>
            <p className="text-slate-400 leading-relaxed">
              Workers no longer rely on payday loans. If they've earned it, they can claim it instantly with fraction-of-a-cent fees.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-[#00ff88]/30 transition-colors">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-6 text-[#00ff88]">
              🔒
            </div>
            <h3 className="text-xl font-bold mb-3">Trustless Soroban Smart Contracts</h3>
            <p className="text-slate-400 leading-relaxed">
              Zero counterparty risk. Funds are locked mathematically in immutable Rust contracts until properly claimed.
            </p>
          </div>
        </div>
      </div>
      
      {/* Decorative background element */}
      <div className="fixed top-0 right-0 -z-10 w-[800px] h-[800px] bg-[#00ff88]/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
    </div>
  );
}
