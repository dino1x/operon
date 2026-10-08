import assert from "node:assert";
import hre from "hardhat";
import { parseEther, keccak256, encodePacked } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

describe("OperonAgentVault - T3tris & Advance Primitives on Monad", function () {
  async function deployVaultFixture() {
    const [owner, depositor, agentOperator] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    // 1. Deploy OperonRegistryERC8004
    const registry = await hre.viem.deployContract("OperonRegistryERC8004");

    // 2. Deploy OperonPolicyManager
    const policyManager = await hre.viem.deployContract("OperonPolicyManager", [
      registry.address,
    ]);

    // 3. Deploy OperonAgentVault linked to PolicyManager
    const vault = await hre.viem.deployContract("OperonAgentVault", [
      policyManager.address,
    ]);

    // Configure vault in policyManager
    await policyManager.write.setAgentVault([vault.address]);

    // 4. Deploy TestOrderBook (Kuru DEX target)
    const orderBook = await hre.viem.deployContract("TestOrderBook");

    return {
      registry,
      policyManager,
      vault,
      orderBook,
      owner,
      depositor,
      agentOperator,
      publicClient,
    };
  }

  it("Accepts permissionless depositor liquidity and mints vault shares (T3tris model)", async function () {
    const { vault, depositor } = await deployVaultFixture();

    const depositAmount = parseEther("5");
    await depositor.sendTransaction({
      to: vault.address,
      value: depositAmount,
    });
    // Or call deposit explicitly
    await vault.write.deposit({
      value: depositAmount,
      account: depositor.account,
    });

    const shares = await vault.read.shareBalance([depositor.account.address]);
    assert.strictEqual(shares, depositAmount);

    const totalAssets = await vault.read.totalAssets();
    assert.strictEqual(totalAssets >= depositAmount, true);
  });

  it("Borrows credit within bounded quota and enforces circuit breaker halt (Advance & Cassie models)", async function () {
    const { registry, policyManager, vault, orderBook, owner, depositor, publicClient } = await deployVaultFixture();

    // 1. Depositor deposits 10 MON into vault
    await vault.write.deposit({
      value: parseEther("10"),
      account: depositor.account,
    });

    // 2. Set max agent credit quota to 3 MON
    await vault.write.setAgentCreditQuota([parseEther("3")]);

    // 3. Register ERC-8004 agent
    const agentName = "Kuru Arbitrage Sentinel";
    await registry.write.registerAgent([agentName, "ipfs://qwen25-tee", owner.account.address]);
    const agentIds = await registry.read.getAllAgentIds();
    const agentId = agentIds[0];

    // 4. Register ephemeral sub-key in PolicyManager
    const ephemeralPrivKey = generatePrivateKey();
    const ephemeralAccount = privateKeyToAccount(ephemeralPrivKey);

    await policyManager.write.registerSession([
      ephemeralAccount.address,
      agentId,
      parseEther("2.5"), // 2.5 MON spend cap
      3600n,            // 1 hour validity
      [orderBook.address],
    ]);

    // 5. Ephemeral key signs execution envelope borrowing 1 MON from vault
    const creditToBorrow = parseEther("1.0");
    const calldata = "0x" as `0x${string}`; // Empty orderbook ping or low-level call
    const chainId = BigInt(await publicClient.getChainId());
    const totalExecutions = await policyManager.read.totalExecutions();

    const messageHash = keccak256(
      encodePacked(
        ["address", "address", "address", "uint256", "bytes32", "uint256", "uint256"],
        [
          policyManager.address,
          ephemeralAccount.address,
          orderBook.address,
          creditToBorrow,
          keccak256(calldata),
          chainId,
          totalExecutions,
        ]
      )
    );

    const signature = await ephemeralAccount.signMessage({
      message: { raw: messageHash },
    });

    // 6. Execute transaction with vault credit
    await policyManager.write.executeWithVaultCredit([
      ephemeralAccount.address,
      orderBook.address,
      creditToBorrow,
      calldata,
      signature,
    ]);

    const activeBorrows = await vault.read.activeAgentBorrows();
    assert.strictEqual(activeBorrows, creditToBorrow);

    // 7. Verify Emergency Circuit Breaker immediately halts borrowing
    await policyManager.write.tripCircuitBreaker();
    const isTripped = await policyManager.read.circuitBreakerTripped();
    assert.strictEqual(isTripped, true);

    await assert.rejects(
      async () => {
        await policyManager.write.executeWithVaultCredit([
          ephemeralAccount.address,
          orderBook.address,
          creditToBorrow,
          calldata,
          signature,
        ]);
      },
      /OperonPolicy: Circuit breaker active/
    );
  });

  it("Enforces Cordon downward narrowing and downward sub-mandate delegation", async function () {
    const { policyManager, orderBook, owner } = await deployVaultFixture();

    const parentAccount = privateKeyToAccount(generatePrivateKey());
    const childAccount = privateKeyToAccount(generatePrivateKey());

    // Register parent session with 3.0 MON cap
    await policyManager.write.registerSession([
      parentAccount.address,
      keccak256(encodePacked(["string"], ["Root Orchestrator"])),
      parseEther("3.0"),
      3600n,
      [orderBook.address],
    ]);

    // Delegate sub-mandate to child with 1.0 MON cap (strictly narrower)
    await policyManager.write.delegateSubMandate([
      parentAccount.address,
      childAccount.address,
      keccak256(encodePacked(["string"], ["Worker Sub-Agent"])),
      parseEther("1.0"),
      1800n, // Narrower validity (30 mins vs 60 mins)
      [orderBook.address],
    ]);

    const childSession = await policyManager.read.getSession([childAccount.address]);
    assert.strictEqual(childSession.parentSessionKey.toLowerCase(), parentAccount.address.toLowerCase());
    assert.strictEqual(childSession.spendCap, parseEther("1.0"));

    // Attempting to delegate child cap exceeding parent headroom must revert (Narrowing violation)
    const rogueChild = privateKeyToAccount(generatePrivateKey());
    await assert.rejects(
      async () => {
        await policyManager.write.delegateSubMandate([
          parentAccount.address,
          rogueChild.address,
          keccak256(encodePacked(["string"], ["Rogue Child"])),
          parseEther("5.0"), // Exceeds parent's 3.0 MON
          1800n,
          [orderBook.address],
        ]);
      },
      /OperonPolicy: Narrowing violation: Exceeds available parent spend headroom/
    );
  });

  it("Blocks adversarial prompt injection onchain and emits ERC-8004 ConductRecord (Advance & Cordon)", async function () {
    const { registry, policyManager, orderBook, owner } = await deployVaultFixture();

    const agentName = "Adversarial Test Sentinel";
    await registry.write.registerAgent([agentName, "ipfs://qwen-adversarial", owner.account.address]);
    const agentIds = await registry.read.getAllAgentIds();
    const agentId = agentIds[0];

    const rogueAccount = privateKeyToAccount(generatePrivateKey());
    await policyManager.write.registerSession([
      rogueAccount.address,
      agentId,
      parseEther("1.0"),
      3600n,
      [orderBook.address],
    ]);

    // Rogue target outside whitelist
    const attackerAddress = "0x000000000000000000000000000000000000dEaD" as `0x${string}`;

    await assert.rejects(
      async () => {
        await policyManager.write.attemptAdversarialExecution([
          rogueAccount.address,
          attackerAddress,
          parseEther("100.0"), // Exceeds spend cap + unauthorized target
          "0xdeadbeef" as `0x${string}`,
        ]);
      },
      /OperonPolicy: Exploit prevented onchain: UNAUTHORIZED_TARGET_CONTRACT/
    );

    // Cordon daemon publishes refusal receipt to ERC-8004 ConductRecord
    await registry.write.recordViolation([
      agentId,
      "UNAUTHORIZED_TARGET_CONTRACT",
      attackerAddress,
      "0xdeadbeef",
    ]);

    // Verify reputation was penalized in ERC-8004 registry
    const agent = await registry.read.getAgent([agentId]);
    assert.strictEqual(agent.reputationScore < 10000n, true);
    assert.strictEqual(agent.totalTasks, 1n);
  });

  it("Evaluates multi-point risk via Truvian Shield engine (Telegraph Hackathon Winner)", async function () {
    const { policyManager, orderBook, owner } = await deployVaultFixture();

    const sessionAccount = privateKeyToAccount(generatePrivateKey());
    await policyManager.write.registerSession([
      sessionAccount.address,
      keccak256(encodePacked(["string"], ["Truvian Guarded Sentinel"])),
      parseEther("2.0"), // 2.0 MON cap
      3600n,
      [orderBook.address],
    ]);

    // 1. Low risk trade: 0.1 MON (5% VaR)
    const [lowScore, lowPermitted, lowAudit] = await policyManager.read.evaluateTruvianRisk([
      sessionAccount.address,
      orderBook.address,
      parseEther("0.1"),
    ]);
    assert.strictEqual(lowPermitted, true);
    assert.strictEqual(lowScore <= 35n, true);
    assert.strictEqual(lowAudit, "LOW_RISK: CLEAR_FOR_DISPATCH");

    // 2. High VaR trade: 1.8 MON (90% VaR) -> Exceeds safety threshold
    const [highScore, highPermitted, highAudit] = await policyManager.read.evaluateTruvianRisk([
      sessionAccount.address,
      orderBook.address,
      parseEther("1.8"),
    ]);
    assert.strictEqual(highPermitted, false);
    assert.strictEqual(highScore > 50n, true);
    assert.strictEqual(highAudit, "HIGH_RISK: VAR_THRESHOLD_EXCEEDED");
  });
});
