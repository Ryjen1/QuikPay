import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import ConnectAccount from "../ConnectAccount";
import NotificationCenter from "./NotificationCenter";

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  const navLinks = [
    { to: "/employer", label: "Employer" },
    { to: "/worker", label: "Worker" },
  ];

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 ${
      isActive
        ? "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]"
        : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--primary-700)]"
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
          ? "bg-[var(--primary-900)]/80 backdrop-blur-xl border-b border-[var(--border-primary)]"
          : "bg-[var(--primary-900)] border-b border-[var(--border-secondary)]"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <NavLink to="/" className="flex items-center gap-3 group">
              <div className="text-2xl font-bold tracking-tight text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-blue)]">
                QuikPay
              </div>
            </NavLink>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={navLinkClass}>
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            <ConnectAccount />
            <NotificationCenter />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
