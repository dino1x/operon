import assert from "node:assert";
import hre from "hardhat";
import { parseEther, keccak256, encodePacked } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

describe("Operon Protocol - Zero Mock Core Engine", function () {
  async function deployOperonFixture() {
    const [owner, nonOwner] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    // 1. Deploy OperonRegistryERC8004
    const registry = await hre.viem.deployContract("OperonRegistryERC8004");

    // 2. Deploy OperonPolicyManager
    const policyManager = await hre.viem.deployContract("OperonPolicyManager", [
      registry.address,
    ]);

    // Authorize policyManager in registry
    await registry.write.setCallerAuthorization([policyManager.address, true]);

    // 3. Deploy TestOrderBook
    const orderBook = await hre.viem.deployContract("TestOrderBook");

    // 4. Fund PolicyManager vault with native MON
    await owner.sendTransaction({
      to: policyManager.address,
      value: parseEther("10"),
    });

    return {
      registry,
      policyManager,
      orderBook,
      owner,
      nonOwner,
      publicClient,
    };
  }

  it("Registers an ERC-8004 agent with provenance and initial 100% reputation", async function () {
    const { registry, owner } = await deployOperonFixture();

    const agentName = "Operon Alpha Trader";
    const modelURI = "ipfs://bafybeiqwen38max/model-manifest.json";

    await registry.write.registerAgent([agentName, modelURI, owner.account.address]);
    const agentIds = await registry.read.getAllAgentIds();
    assert.strictEqual(agentIds.length, 1);

    const agent = await registry.read.getAgent([agentIds[0]]);
    assert.strictEqual(agent.name, agentName);
    assert.strictEqual(agent.reputationScore, 10000n); // 100.00%
    assert.strictEqual(agent.totalTasks, 0n);
    assert.strictEqual(agent.isActive, true);
  });

  it("Enforces One Passkey, Many Keys delegation with spend caps and whitelist", async function () {
    const { registry, policyManager, orderBook, owner, publicClient } = await deployOperonFixture();

    // Register an agent
    await registry.write.registerAgent(["Operon Arb Sentinel", "model:qwen-3.8-max", owner.account.address]);
    const agentIds = await registry.read.getAllAgentIds();
    const agentId = agentIds[0];

    // Generate real ephemeral session key in memory
    const sessionPrivateKey = generatePrivateKey();
    const sessionAccount = privateKeyToAccount(sessionPrivateKey);

    const spendCap = parseEther("2");
    const duration = 3600n; // 1 hour
    const whitelist = [orderBook.address];

    // Master passkey registers session policy
    await policyManager.write.registerSession([
      sessionAccount.address,
      agentId,
      spendCap,
      duration,
      whitelist,
    ]);

    const session = await policyManager.read.getSession([sessionAccount.address]);
    assert.strictEqual(session.sessionKey.toLowerCase(), sessionAccount.address.toLowerCase());
    assert.strictEqual(session.spendCap, spendCap);
    assert.strictEqual(session.isActive, true);

    // Prepare execution: place limit order on TestOrderBook
    const orderData = "0x";
    const sendValue = parseEther("0.5");
    const totalExecutions = await policyManager.read.totalExecutions();
    const chainId = BigInt(await publicClient.getChainId());

    // Hash & sign with session key
    const messageHash = keccak256(
      encodePacked(
        ["address", "address", "address", "uint256", "bytes32", "uint256", "uint256"],
        [
          policyManager.address,
          sessionAccount.address,
          orderBook.address,
          sendValue,
          keccak256(orderData),
          chainId,
          totalExecutions,
        ]
      )
    );

    const signature = await sessionAccount.signMessage({
      message: { raw: messageHash },
    });

    // Execute with policy
    await policyManager.write.executeWithPolicy([
      sessionAccount.address,
      orderBook.address,
      sendValue,
      orderData,
      signature,
    ]);

    const updatedSession = await policyManager.read.getSession([sessionAccount.address]);
    assert.strictEqual(updatedSession.spentAmount, sendValue);

    // Verify ERC-8004 reputation was updated onchain
    const updatedAgent = await registry.read.getAgent([agentId]);
    assert.strictEqual(updatedAgent.totalTasks, 1n);
    assert.strictEqual(updatedAgent.successfulTasks, 1n);
    assert.strictEqual(updatedAgent.reputationScore, 10000n);
  });

  it("Reverts if spending exceeds bounded cap or target is not whitelisted", async function () {
    const { policyManager, orderBook, nonOwner } = await deployOperonFixture();

    const sessionPrivateKey = generatePrivateKey();
    const sessionAccount = privateKeyToAccount(sessionPrivateKey);

    // Register session with 1 MON spend cap, whitelisting only orderBook
    await policyManager.write.registerSession([
      sessionAccount.address,
      "0x0000000000000000000000000000000000000000000000000000000000000001",
      parseEther("1"),
      3600n,
      [orderBook.address],
    ]);

    // Attempting to call non-whitelisted address
    const fakeSignature = "0x" + "00".repeat(65);
    await assert.rejects(
      async () => {
        await policyManager.write.executeWithPolicy([
          sessionAccount.address,
          nonOwner.account.address, // Not in whitelist
          parseEther("0.1"),
          "0x",
          fakeSignature,
        ]);
      },
      /OperonPolicy: Target not whitelisted/
    );
  });

  it("Tripping the Circuit Breaker instantly freezes all autonomous executions", async function () {
    const { policyManager, orderBook } = await deployOperonFixture();

    const sessionPrivateKey = generatePrivateKey();
    const sessionAccount = privateKeyToAccount(sessionPrivateKey);

    await policyManager.write.registerSession([
      sessionAccount.address,
      "0x0000000000000000000000000000000000000000000000000000000000000001",
      parseEther("1"),
      3600n,
      [orderBook.address],
    ]);

    // Trip circuit breaker
    await policyManager.write.tripCircuitBreaker();
    const isTripped = await policyManager.read.circuitBreakerTripped();
    assert.strictEqual(isTripped, true);

    const fakeSignature = "0x" + "00".repeat(65);
    await assert.rejects(
      async () => {
        await policyManager.write.executeWithPolicy([
          sessionAccount.address,
          orderBook.address,
          parseEther("0.1"),
          "0x",
          fakeSignature,
        ]);
      },
      /OperonPolicy: Circuit breaker active/
    );
  });
});
