import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";

interface WalletGuardProps {
  children: ReactNode;
}

const WalletGuard: React.FC<WalletGuardProps> = ({ children }) => {
  const { address } = useWallet();
  const location = useLocation();

  if (!address) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default WalletGuard;
