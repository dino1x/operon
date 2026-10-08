import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { formatEther } from "viem";

async function main() {
  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();
  const chainId = await publicClient.getChainId();

  console.log("--------------------------------------------------");
  console.log("Deploying Operon Protocol to Chain ID:", chainId);
  console.log("Deployer Address:", deployer.account.address);
  const balance = await publicClient.getBalance({ address: deployer.account.address });
  console.log("Deployer Balance:", formatEther(balance), "MON");
  console.log("--------------------------------------------------");

  // 1. Deploy OperonRegistryERC8004
  console.log("Deploying OperonRegistryERC8004...");
  const registry = await hre.viem.deployContract("OperonRegistryERC8004");
  console.log("OperonRegistryERC8004 deployed to:", registry.address);

  // 2. Deploy OperonPolicyManager
  console.log("Deploying OperonPolicyManager...");
  const policyManager = await hre.viem.deployContract("OperonPolicyManager", [
    registry.address,
  ]);
  console.log("OperonPolicyManager deployed to:", policyManager.address);

  // Authorize PolicyManager in Registry
  console.log("Authorizing PolicyManager in Registry...");
  const authTx = await registry.write.setCallerAuthorization([policyManager.address, true]);
  await publicClient.waitForTransactionReceipt({ hash: authTx });
  console.log("Authorization confirmed.");

  // 3. Deploy TestOrderBook
  console.log("Deploying TestOrderBook...");
  const orderBook = await hre.viem.deployContract("TestOrderBook");
  console.log("TestOrderBook deployed to:", orderBook.address);

  // 4. Deploy TestMON
  console.log("Deploying TestMON...");
  const testMon = await hre.viem.deployContract("TestMON");
  console.log("TestMON deployed to:", testMon.address);

  // 5. Register Default Seed Agents under ERC-8004
  console.log("Registering default ERC-8004 AI agents...");
  const agent1Tx = await registry.write.registerAgent([
    "Kuru Arbitrage Sentinel",
    "ipfs://bafybeiqwen38max-arbitrage/agent.json",
    deployer.account.address,
  ]);
  await publicClient.waitForTransactionReceipt({ hash: agent1Tx });

  const agent2Tx = await registry.write.registerAgent([
    "Volatility Grid Rebalancer",
    "ipfs://bafybeikimi-rebalancer/agent.json",
    deployer.account.address,
  ]);
  await publicClient.waitForTransactionReceipt({ hash: agent2Tx });

  const agentIds = await registry.read.getAllAgentIds();
  console.log("Registered Agents count:", agentIds.length);

  // 6. Save deployment artifact
  const deploymentData = {
    chainId,
    deployedAt: new Date().toISOString(),
    network: chainId === 10143 ? "Monad Testnet" : "Local Testnet",
    contracts: {
      OperonRegistryERC8004: registry.address,
      OperonPolicyManager: policyManager.address,
      TestOrderBook: orderBook.address,
      TestMON: testMon.address,
    },
    defaultAgents: agentIds,
  };

  const outputPath = path.join(__dirname, "..", "deployed-addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));
  console.log("Saved deployment configuration to:", outputPath);
  console.log("--------------------------------------------------");
  console.log("Operon Protocol deployment complete.");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
