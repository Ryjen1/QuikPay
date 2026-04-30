import { Router, Response } from "express";
import {
  generateAuthChallenge,
  verifyWalletSignature,
  issueToken,
} from "../services/walletAuth";
import { AuthenticatedRequest } from "../middleware/rbac";

export const authRouter = Router();

interface AuthChallengeRequest {
  walletAddress: string;
}

interface AuthVerifyRequest {
  walletAddress: string;
  signedMessage: string;
}

/**
 * GET /auth/challenge
 * Generate a challenge message for the user to sign
 */
authRouter.post("/challenge", (req: AuthenticatedRequest, res: Response) => {
  try {
    const { walletAddress } = req.body as AuthChallengeRequest;

    if (!walletAddress || typeof walletAddress !== "string") {
      res.status(400).json({ error: "Invalid wallet address" });
      return;
    }

    // Validate Stellar address format (starts with G, 56 characters)
    if (!/^G[A-Z0-9]{55}$/.test(walletAddress)) {
      res.status(400).json({ error: "Invalid Stellar address format" });
      return;
    }

    const challenge = generateAuthChallenge(walletAddress);
    res.json({ challenge, expiresIn: 600 }); // 10 minutes
  } catch (error) {
    res.status(500).json({ error: "Failed to generate challenge" });
  }
});

/**
 * POST /auth/verify
 * Verify the signed message and issue JWT token
 */
authRouter.post("/verify", (req: AuthenticatedRequest, res: Response) => {
  try {
    const { walletAddress, signedMessage } = req.body as AuthVerifyRequest;

    if (!walletAddress || !signedMessage) {
      res.status(400).json({ error: "Missing wallet address or signed message" });
      return;
    }

    // Verify signature
    const verifiedAddress = verifyWalletSignature(signedMessage, signedMessage);

    if (!verifiedAddress || verifiedAddress !== walletAddress) {
      res.status(401).json({ error: "Invalid signature or wallet address mismatch" });
      return;
    }

    // Issue JWT token
    const token = issueToken(walletAddress, "user");

    res.json({
      token,
      walletAddress,
      expiresIn: 604800, // 7 days in seconds
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to verify signature" });
  }
});

/**
 * POST /auth/refresh
 * Refresh an existing JWT token
 */
authRouter.post(
  "/refresh",
  (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // Issue new token
      const token = issueToken(
        req.user.stellarAddress || req.user.id,
        req.user.role === 2 ? "admin" : req.user.role === 4 ? "superadmin" : "user"
      );

      res.json({
        token,
        expiresIn: 604800,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to refresh token" });
    }
  }
);
