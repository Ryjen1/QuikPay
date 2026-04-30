import { NavLink } from "react-router-dom";
import { Button } from "../components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-24 text-white selection:bg-[var(--accent-blue)] selection:text-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-5 gap-12 items-center">
          {/* Left Content - 60% */}
          <div className="lg:col-span-3 space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 text-[var(--accent-blue)] text-sm font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-teal)] animate-pulse" />
              Live on Stellar Testnet
            </div>
            
            {/* Headline */}
            <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              Real-Time Wage <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-teal)]">
                Streaming on Stellar
              </span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-xl text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              Eliminate the 30-day wait for monthly payday. Workers withdraw earned wages instantly with mathematically sound time-based accrual on the Stellar blockchain.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <NavLink to="/employer">
                <Button variant="primary" size="xl" className="w-full sm:w-auto">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Setup Employer Vault
                </Button>
              </NavLink>
              <NavLink to="/worker">
                <Button variant="secondary" size="xl" className="w-full sm:w-auto">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Worker Portal
                </Button>
              </NavLink>
            </div>
          </div>

          {/* Right Visual - 40% */}
          <div className="lg:col-span-2 relative">
            <div className="relative">
              {/* Mesh Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-blue)]/20 via-transparent to-[var(--accent-teal)]/20 rounded-3xl blur-3xl" />
              
              {/* Floating Card */}
              <div className="relative bg-gradient-to-b from-[var(--primary-800)] to-[var(--primary-900)] border border-[var(--border-primary)] rounded-2xl p-8 shadow-[var(--shadow-xl)]">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--text-tertiary)]">REAL-TIME EARNINGS</span>
                    <div className="w-2 h-2 rounded-full bg-[var(--accent-teal)] animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-[var(--text-primary)] font-mono">
                      1,234.567
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">XLM Available</div>
                  </div>
                  <div className="h-2 bg-[var(--primary-700)] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-teal)] rounded-full" style={{ width: '65%' }} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--accent-teal)]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="font-medium">+12.5% this week</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-20 border-t border-[var(--border-secondary)]">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="group p-8 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent-blue)]/30 transition-all hover:shadow-[var(--shadow-lg)]">
            <div className="w-12 h-12 bg-[var(--accent-blue)]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[var(--accent-blue)]/20 transition-colors">
              <svg className="w-6 h-6 text-[var(--accent-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)]">Time-Based Accrual</h3>
            <p className="text-[var(--text-tertiary)] leading-relaxed">
              Employers deposit liquid funds. Wages mathematically unlock per second according to the contracted rate.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group p-8 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent-teal)]/30 transition-all hover:shadow-[var(--shadow-lg)]">
            <div className="w-12 h-12 bg-[var(--accent-teal)]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[var(--accent-teal)]/20 transition-colors">
              <svg className="w-6 h-6 text-[var(--accent-teal)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)]">On-Demand Withdrawals</h3>
            <p className="text-[var(--text-tertiary)] leading-relaxed">
              Workers no longer rely on payday loans. If they've earned it, they can claim it instantly with fraction-of-a-cent fees.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group p-8 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent-violet)]/30 transition-all hover:shadow-[var(--shadow-lg)]">
            <div className="w-12 h-12 bg-[var(--accent-violet)]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[var(--accent-violet)]/20 transition-colors">
              <svg className="w-6 h-6 text-[var(--accent-violet)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)]">Trustless Smart Contracts</h3>
            <p className="text-[var(--text-tertiary)] leading-relaxed">
              Zero counterparty risk. Funds are locked mathematically in immutable Rust contracts until properly claimed.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-[var(--text-primary)] mb-2">$2.4M</div>
            <div className="text-sm text-[var(--text-tertiary)] uppercase tracking-wide">Total Streamed</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-[var(--text-primary)] mb-2">1,234</div>
            <div className="text-sm text-[var(--text-tertiary)] uppercase tracking-wide">Active Workers</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-[var(--text-primary)] mb-2">98.5%</div>
            <div className="text-sm text-[var(--text-tertiary)] uppercase tracking-wide">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-[var(--text-primary)] mb-2">&lt;1¢</div>
            <div className="text-sm text-[var(--text-tertiary)] uppercase tracking-wide">Avg Fee</div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-teal)] p-12 text-center">
          <div className="relative z-10 space-y-6">
            <h2 className="text-4xl font-bold text-white">Ready to Transform Payroll?</h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Connect your wallet and get started in minutes
            </p>
            <div>
              <NavLink to="/employer">
                <Button variant="secondary" size="xl" className="bg-white text-[var(--primary-900)] hover:bg-white/90">
                  Get Started
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </NavLink>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
}
