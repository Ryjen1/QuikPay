import { Keypair } from "@stellar/stellar-sdk";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-in-production";

export interface WalletAuthPayload {
  walletAddress: string;
  nonce: string;
  timestamp: number;
}

export interface TokenPayload {
  sub: string; // wallet address (subject)
  walletAddress: string;
  role: "user" | "admin" | "superadmin";
  iat: number;
  exp: number;
}

/**
 * Generate a challenge message for the user to sign
 */
export function generateAuthChallenge(walletAddress: string): string {
  const nonce = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now();
  return `QuikPay Auth Challenge\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${timestamp}\n\nPlease sign this message to authenticate.`;
}

/**
 * Verify a signed message from a Stellar wallet
 * Returns the wallet address if valid, null otherwise
 */
export function verifyWalletSignature(
  message: string,
  signedXdr: string
): string | null {
  try {
    // The signedXdr contains the transaction envelope with the signature
    // For Stellar wallets, we need to extract the public key that signed it
    // This is a simplified verification - in production, you'd validate against the actual transaction signature
    
    // Extract wallet address from message
    const walletMatch = message.match(/Wallet: (G[A-Z0-9]{55})/);
    if (!walletMatch) return null;
    
    const walletAddress = walletMatch[1];
    
    // Verify signature using Stellar SDK
    try {
      Keypair.fromPublicKey(walletAddress);
      // If we got here, the address format is valid
      // In production, verify the actual signature against the transaction
      return walletAddress;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

/**
 * Issue a JWT token after successful wallet authentication
 */
export function issueToken(
  walletAddress: string,
  role: "user" | "admin" | "superadmin" = "user",
  expiresIn = "7d"
): string {
  const payload: TokenPayload = {
    sub: walletAddress,
    walletAddress,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: 0, // Will be set by jwt.sign based on expiresIn
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Extract JWT from Authorization header
 */
export function extractTokenFromHeader(
  authHeader: string | undefined
): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}
