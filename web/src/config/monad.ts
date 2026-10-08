import { defineChain } from "viem";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: {
    name: "MON",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
    public: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "MonadExplorer",
      url: "https://testnet.monadexplorer.com",
    },
  },
  testnet: true,
});

export const OPERON_REGISTRY_ABI = [
  {
    type: "function",
    name: "registerAgent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "modelURI", type: "string" },
      { name: "operator", type: "address" },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "getAgent",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "bytes32" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "agentId", type: "bytes32" },
          { name: "name", type: "string" },
          { name: "modelURI", type: "string" },
          { name: "operator", type: "address" },
          { name: "reputationScore", type: "uint256" },
          { name: "totalTasks", type: "uint256" },
          { name: "successfulTasks", type: "uint256" },
          { name: "registeredAt", type: "uint256" },
          { name: "lastActiveBlock", type: "uint256" },
          { name: "isActive", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getAllAgentIds",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bytes32[]" }],
  },
] as const;

export const OPERON_POLICY_ABI = [
  {
    type: "function",
    name: "registerSession",
    stateMutability: "nonpayable",
    inputs: [
      { name: "sessionKey", type: "address" },
      { name: "agentId", type: "bytes32" },
      { name: "spendCap", type: "uint256" },
      { name: "duration", type: "uint256" },
      { name: "whitelist", type: "address[]" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "revokeSession",
    stateMutability: "nonpayable",
    inputs: [{ name: "sessionKey", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "tripCircuitBreaker",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "resetCircuitBreaker",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "circuitBreakerTripped",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "totalExecutions",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getSession",
    stateMutability: "view",
    inputs: [{ name: "sessionKey", type: "address" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "sessionKey", type: "address" },
          { name: "agentId", type: "bytes32" },
          { name: "spendCap", type: "uint256" },
          { name: "spentAmount", type: "uint256" },
          { name: "validUntil", type: "uint256" },
          { name: "isActive", type: "bool" },
          { name: "targets", type: "address[]" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "executeWithPolicy",
    stateMutability: "nonpayable",
    inputs: [
      { name: "sessionKey", type: "address" },
      { name: "target", type: "address" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [{ name: "", type: "bytes" }],
  },
  {
    type: "function",
    name: "simulateExecution",
    stateMutability: "view",
    inputs: [
      { name: "sessionKey", type: "address" },
      { name: "target", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [
      { name: "allowed", type: "bool" },
      { name: "reason", type: "string" },
    ],
  },
  {
    type: "function",
    name: "evaluateTruvianRisk",
    stateMutability: "view",
    inputs: [
      { name: "sessionKey", type: "address" },
      { name: "target", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [
      { name: "riskScore", type: "uint256" },
      { name: "isPermitted", type: "bool" },
      { name: "riskAudit", type: "string" },
    ],
  },
  {
    type: "function",
    name: "attemptAdversarialExecution",
    stateMutability: "nonpayable",
    inputs: [
      { name: "sessionKey", type: "address" },
      { name: "rogueTarget", type: "address" },
      { name: "attemptedAmount", type: "uint256" },
      { name: "rogueData", type: "bytes" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export const TEST_ORDERBOOK_ABI = [
  {
    type: "function",
    name: "placeLimitOrder",
    stateMutability: "payable",
    inputs: [
      { name: "isBuy", type: "bool" },
      { name: "price", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalOrdersPlaced",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export const OPERON_VAULT_ABI = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "payable",
    inputs: [],
    outputs: [{ name: "shares", type: "uint256" }],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [{ name: "shares", type: "uint256" }],
    outputs: [{ name: "payout", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalAssets",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalShares",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "shareBalance",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "maxAgentCreditQuota",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "activeAgentBorrows",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalProfitsDistributed",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "accruedPerformanceFees",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "claimPerformanceFee",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [{ name: "amount", type: "uint256" }],
  },
  {
    type: "function",
    name: "getVaultMetrics",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "totalAUM", type: "uint256" },
      { name: "availableIdle", type: "uint256" },
      { name: "activeBorrows", type: "uint256" },
      { name: "creditQuota", type: "uint256" },
      { name: "distributedYield", type: "uint256" },
      { name: "claimableFees", type: "uint256" },
    ],
  },
] as const;

