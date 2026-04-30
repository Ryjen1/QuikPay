import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import ConnectAccount from "../ConnectAccount";
import NotificationCenter from "./NotificationCenter";

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const navLinks = [
    { to: "/employer", label: "Employer Workspace" },
    { to: "/worker", label: "Worker Dashboard" },
  ];

  const closeMenu = () => setIsMenuOpen(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative inline-flex min-h-11 items-center rounded-md px-4 py-2 text-sm font-semibold transition-all duration-200 ${
      isActive
        ? "bg-white/10 text-white border-b-2 border-[#00ff88]"
        : "text-slate-400 hover:text-white"
    }`;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#0B0F19]/90 backdrop-blur-xl border-b border-white/5"
          : "bg-[#0B0F19] border-b border-white/5"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <NavLink to="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#00ff88] to-emerald-600 text-[#0B0F19] font-black text-sm tracking-widest shadow-lg">
                QK
              </div>
              <span className="block text-xl font-bold tracking-tight text-white">
                QuikPay
              </span>
            </NavLink>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={navLinkClass}>
                {link.label}
              </NavLink>
            ))}
            <div className="border-l border-white/10 pl-4">
              <ConnectAccount />
            </div>
            <NotificationCenter />
          </div>

          {/* Mobile Menu Button - Minimal handling for MVP */}
          <div className="flex md:hidden items-center gap-2">
            <ConnectAccount />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
