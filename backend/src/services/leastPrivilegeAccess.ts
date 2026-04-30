import { vaultService } from "./vaultService";
import { VaultClient } from "./vaultClient";
import { logServiceError, logServiceInfo } from "../audit/serviceLogger";

export interface LeastPrivilegePolicy {
  name: string;
  description: string;
  path: string;
  capabilities: string[];
  requiredSecretPaths: string[];
}

export const QUIKPAY_POLICIES = {
  AGENT_KEY_ACCESS: {
    name: "quikpay-agent-key-access",
    description: "Least privilege access for AI agent to sign transactions",
    path: "quikpay/keys",
    capabilities: ["read"],
    requiredSecretPaths: ["quikpay/keys/hot-wallet"],
  },

  KEY_ROTATION: {
    name: "quikpay-key-rotation",
    description: "Policy for automated key rotation service",
    path: "quikpay/keys",
    capabilities: ["create", "read", "update", "delete"],
    requiredSecretPaths: ["quikpay/keys/*"],
  },

  ADMIN: {
    name: "quikpay-admin",
    description: "Full administrative access to QuikPay secrets",
    path: "quikpay",
    capabilities: ["create", "read", "update", "delete", "list"],
    requiredSecretPaths: ["quikpay/*"],
  },
};

export class LeastPrivilegeAccess {
  private client: VaultClient;

  constructor(client: VaultClient) {
    this.client = client;
  }

  generatePolicyDocument(policy: LeastPrivilegePolicy): string {
    const pathRules = policy.requiredSecretPaths.map((path) => {
      return `
path "${path}" {
  capabilities = [${policy.capabilities.map((c) => `"${c}"`).join(", ")}]
}`;
    });

    return `
# ${policy.description}
name = "${policy.name}"
${pathRules.join("\n")}
`.trim();
  }

  async createAgentPolicy(): Promise<boolean> {
    try {
      const policyDocument = this.generatePolicyDocument(
        QUIKPAY_POLICIES.AGENT_KEY_ACCESS,
      );
      await this.client.createPolicy(
        QUIKPAY_POLICIES.AGENT_KEY_ACCESS.name,
        policyDocument,
      );
      await logServiceInfo(
        "LeastPrivilegeAccess",
        "Created agent policy successfully",
      );
      return true;
    } catch (error) {
      await logServiceError(
        "LeastPrivilegeAccess",
        "Failed to create agent policy",
        error,
      );
      return false;
    }
  }

  async createRotationPolicy(): Promise<boolean> {
    try {
      const policyDocument = this.generatePolicyDocument(
        QUIKPAY_POLICIES.KEY_ROTATION,
      );
      await this.client.createPolicy(
        QUIKPAY_POLICIES.KEY_ROTATION.name,
        policyDocument,
      );
      await logServiceInfo(
        "LeastPrivilegeAccess",
        "Created rotation policy successfully",
      );
      return true;
    } catch (error) {
      await logServiceError(
        "LeastPrivilegeAccess",
        "Failed to create rotation policy",
        error,
      );
      return false;
    }
  }

  async createAppRole(
    roleName: string,
    policyNames: string[],
  ): Promise<boolean> {
    try {
      await this.client.createAppRole(roleName, policyNames);
      await logServiceInfo("LeastPrivilegeAccess", "Created AppRole", {
        role_name: roleName,
        policy_names: policyNames,
      });
      return true;
    } catch (error) {
      await logServiceError(
        "LeastPrivilegeAccess",
        "Failed to create AppRole",
        error,
        {
          role_name: roleName,
          policy_names: policyNames,
        },
      );
      return false;
    }
  }

  async setupLeastPrivilegeAccess(): Promise<boolean> {
    try {
      await this.createAgentPolicy();
      await this.createRotationPolicy();
      await this.createAppRole("quikpay-agent", ["quikpay-agent-key-access"]);
      await this.createAppRole("quikpay-rotation", ["quikpay-key-rotation"]);

      await logServiceInfo(
        "LeastPrivilegeAccess",
        "Successfully set up least privilege access",
      );
      return true;
    } catch (error) {
      await logServiceError(
        "LeastPrivilegeAccess",
        "Failed to set up least privilege access",
        error,
      );
      return false;
    }
  }
}

export const leastPrivilegeAccess = new LeastPrivilegeAccess(
  new VaultClient({
    url: process.env.VAULT_ADDR || "http://localhost:8200",
    token: process.env.VAULT_TOKEN || "",
  }),
);
