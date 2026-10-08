import {
  generatePrivateKey,
  privateKeyToAccount,
} from "viem/accounts";
import {
  keccak256,
  encodePacked,
  parseEther,
  formatEther,
} from "viem";

export interface SessionKeyInfo {
  sessionKey: `0x${string}`;
  privateKey: `0x${string}`;
  agentId: `0x${string}`;
  agentName: string;
  spendCapMON: string;
  spendCapWei: bigint;
  spentWei: bigint;
  durationSeconds: number;
  validUntil: number;
  whitelist: `0x${string}`[];
  isActive: boolean;
}

const STORAGE_SESSION_PREFIX = "operon_session_";

/**
 * Generate a real ephemeral cryptographic session keypair for a specific autonomous agent
 */
export function createSessionKey(
  agentId: `0x${string}`,
  agentName: string,
  spendCapMON: string,
  durationHours: number,
  whitelist: `0x${string}`[]
): SessionKeyInfo {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  const durationSeconds = Math.floor(durationHours * 3600);
  const validUntil = Math.floor(Date.now() / 1000) + durationSeconds;

  const session: SessionKeyInfo = {
    sessionKey: account.address,
    privateKey,
    agentId,
    agentName,
    spendCapMON,
    spendCapWei: parseEther(spendCapMON),
    spentWei: 0n,
    durationSeconds,
    validUntil,
    whitelist,
    isActive: true,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(
      `${STORAGE_SESSION_PREFIX}${account.address}`,
      JSON.stringify({
        ...session,
        spendCapWei: session.spendCapWei.toString(),
        spentWei: session.spentWei.toString(),
      })
    );
  }

  return session;
}

/**
 * Signs an execution payload using the agent's ephemeral session key
 */
export async function signExecutionIntent(
  session: SessionKeyInfo,
  policyManagerAddress: `0x${string}`,
  target: `0x${string}`,
  valueWei: bigint,
  calldata: `0x${string}`,
  chainId: number,
  executionNonce: bigint
): Promise<`0x${string}`> {
  const account = privateKeyToAccount(session.privateKey);

  const messageHash = keccak256(
    encodePacked(
      ["address", "address", "address", "uint256", "bytes32", "uint256", "uint256"],
      [
        policyManagerAddress,
        session.sessionKey,
        target,
        valueWei,
        keccak256(calldata),
        BigInt(chainId),
        executionNonce,
      ]
    )
  );

  const signature = await account.signMessage({
    message: { raw: messageHash },
  });

  return signature;
}

export function loadStoredSessions(): SessionKeyInfo[] {
  if (typeof window === "undefined") return [];
  const sessions: SessionKeyInfo[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_SESSION_PREFIX)) {
      try {
        const item = JSON.parse(localStorage.getItem(key) || "{}");
        sessions.push({
          ...item,
          spendCapWei: BigInt(item.spendCapWei),
          spentWei: BigInt(item.spentWei),
        });
      } catch (e) {
        console.error("Failed to parse session", e);
      }
    }
  }

  return sessions;
}
