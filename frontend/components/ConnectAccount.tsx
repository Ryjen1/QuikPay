import React from "react";
import { WalletButton } from "./WalletButton";

const ConnectAccount: React.FC = () => {
  return (
    <div
      id="tour-connect-wallet"
      aria-label="Account and Network Tools"
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "var(--connect-account-justify, flex-end)",
        flexWrap: "wrap",
        gap: "10px",
        verticalAlign: "middle",
        maxWidth: "100%",
      }}
    >
      <WalletButton />
    </div>
  );
};

export default ConnectAccount;
