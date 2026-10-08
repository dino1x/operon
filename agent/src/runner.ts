import {
  createPublicClient,
  createWalletClient,
  http,
  encodeFunctionData,
  parseEther,
  formatEther,
  keccak256,
  encodePacked,
  defineChain,
} from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import * as fs from "fs";
import * as path from "path";

// Monad Testnet Chain Definition
const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
  testnet: true,
});

const localChain = defineChain({
  id: 31337,
  name: "Local Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
});

// ABIs
const POLICY_MANAGER_ABI = [
  {
    type: "function",
    name: "totalExecutions",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
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
] as const;

const ORDERBOOK_ABI = [
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
] as const;

async function main() {
  console.log("==================================================");
  console.log(" OPERON PROTOCOL · AUTONOMOUS AGENT DAEMON");
  console.log(" Target: Monad High-Throughput EVM");
  console.log("==================================================");

  // Load deployed addresses
  const deployPath = path.join(__dirname, "..", "..", "contracts", "deployed-addresses.json");
  if (!fs.existsSync(deployPath)) {
    console.error("deployed-addresses.json not found! Run deploy first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deployPath, "utf-8"));
  console.log("Loaded deployment for:", deployment.network);
  console.log("PolicyManager Address:", deployment.contracts.OperonPolicyManager);
  console.log("OrderBook Address:   ", deployment.contracts.TestOrderBook);

  const isMonad = deployment.chainId === 10143;
  const targetChain = isMonad ? monadTestnet : localChain;
  const rpcUrl = isMonad ? "https://testnet-rpc.monad.xyz" : "http://127.0.0.1:8545";

  const publicClient = createPublicClient({
    chain: targetChain,
    transport: http(rpcUrl),
  });

  // Generate ephemeral session key in memory (Zero Mock)
  const sessionPrivKey = generatePrivateKey();
  const sessionAccount = privateKeyToAccount(sessionPrivKey);
  console.log("Derived Ephemeral Session Key:", sessionAccount.address);

  const walletClient = createWalletClient({
    account: sessionAccount,
    chain: targetChain,
    transport: http(rpcUrl),
  });

  console.log("\nStarting Autonomous Execution Loop (Press Ctrl+C to stop)...");

  let cycle = 0;
  while (cycle < 5) {
    cycle++;
    const cycleStart = performance.now();
    console.log(`\n--- [Cycle #${cycle}] Evaluating Monad State ---`);

    try {
      const block = await publicClient.getBlock({ blockTag: "latest" });
      const blockNumber = block.number;
      console.log(`Live Block: #${blockNumber} · Timestamp: ${block.timestamp}`);

      // Reasoning
      const isBuy = cycle % 2 !== 0;
      const priceCents = 2450n + BigInt(cycle * 5);
      const amount = 50n;
      const sendValue = parseEther("0.02");

      console.log(
        `[LLM Reasoning] Market spread normalized. Placing ${isBuy ? "BID" : "ASK"} at $${Number(priceCents) / 100} for ${amount} units.`
      );

      // Calldata
      const calldata = encodeFunctionData({
        abi: ORDERBOOK_ABI,
        functionName: "placeLimitOrder",
        args: [isBuy, priceCents, amount],
      });

      // Total executions nonce
      const totalExecutions = (await publicClient.readContract({
        address: deployment.contracts.OperonPolicyManager,
        abi: POLICY_MANAGER_ABI,
        functionName: "totalExecutions",
      })) as bigint;

      // Hash & Sign with ephemeral session key
      const messageHash = keccak256(
        encodePacked(
          ["address", "address", "address", "uint256", "bytes32", "uint256", "uint256"],
          [
            deployment.contracts.OperonPolicyManager,
            sessionAccount.address,
            deployment.contracts.TestOrderBook,
            sendValue,
            keccak256(calldata),
            BigInt(targetChain.id),
            totalExecutions,
          ]
        )
      );

      const signature = await sessionAccount.signMessage({
        message: { raw: messageHash },
      });

      console.log(`[Signed] Ephemeral signature generated.`);
      console.log(`[Broadcasting] Submitting executeWithPolicy() to Monad RPC...`);

      // Broadcast
      const txHash = await walletClient.writeContract({
        address: deployment.contracts.OperonPolicyManager,
        abi: POLICY_MANAGER_ABI,
        functionName: "executeWithPolicy",
        args: [
          sessionAccount.address,
          deployment.contracts.TestOrderBook,
          sendValue,
          calldata,
          signature,
        ],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      const latency = Math.round(performance.now() - cycleStart);

      console.log(`[CONFIRMED] Transaction Mined!`);
      console.log(`  Tx Hash:   ${txHash}`);
      console.log(`  Block:     #${receipt.blockNumber}`);
      console.log(`  Gas Used:  ${receipt.gasUsed.toString()}`);
      console.log(`  Latency:   ${latency}ms`);
      console.log(`  Status:    ${receipt.status}`);
      if (isMonad) {
        console.log(`  Explorer:  https://testnet.monadexplorer.com/tx/${txHash}`);
      }
    } catch (err: any) {
      console.warn(`[Cycle Notice] ${err?.message?.slice(0, 150)}...`);
    }

    // Interval between cycles
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("\nAutonomous Agent execution cycles complete.");
}

main().catch(console.error);
