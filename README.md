# Operon Protocol · Metropolis Monad Hackathon

> **Autonomous Agent Liquidity Vault & Policy Execution Engine on Monad**  
> *Permissionless Vaults (T3tris) + Continuous Agent Credit Lines (Advance) + Pre-Signing Order Validation (Cassie) governed by Mera Biometric Passkeys (P-256) on Monad Parallel EVM.*

[![Monad Testnet](https://img.shields.io/badge/Network-Monad%20Testnet%20(10143)-836EF9?logo=ethereum&logoColor=white)](https://testnet.monadexplorer.com)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24%20(Cancun)-363636?logo=solidity&logoColor=white)](https://soliditylang.org/)
[![ERC-8004](https://img.shields.io/badge/Standard-ERC--8004%20Agent%20Identity-emerald)](https://eips.ethereum.org)
[![Mera Passkeys](https://img.shields.io/badge/Auth-WebAuthn%20P256%20Passkeys-blue)](https://mera.xyz)
[![Zero Mock Mandate](https://img.shields.io/badge/Zero--Mock-Enforced%20(GEMINI.md)-crimson)](#zero-mock-law)

---

### Verified Monad Testnet Deployments (Chain ID: 10143)

| Contract | Address | Explorer Link |
| :--- | :--- | :--- |
| **OperonRegistryERC8004** | `0xb86d25cd0317de545c8573f040a589c34a093544` | [View on MonadExplorer](https://testnet.monadexplorer.com/address/0xb86d25cd0317de545c8573f040a589c34a093544) |
| **OperonPolicyManager** | `0xf6ee349a29c99d431640c9be572e55bf435fad64` | [View on MonadExplorer](https://testnet.monadexplorer.com/address/0xf6ee349a29c99d431640c9be572e55bf435fad64) |
| **TestOrderBook (Kuru DEX)** | `0x735a4896e13f954dfdbe1d807509d2ef29c0ed36` | [View on MonadExplorer](https://testnet.monadexplorer.com/address/0x735a4896e13f954dfdbe1d807509d2ef29c0ed36) |
| **TestMON** | `0xe61b55102ed0c3f0425556db522503c6bc351ad5` | [View on MonadExplorer](https://testnet.monadexplorer.com/address/0xe61b55102ed0c3f0425556db522503c6bc351ad5) |
| **Deployer / Curator (dino)** | `0x5222A33A4CaBC993F8354b9fCfD753Cc8C1439FA` | [View on MonadExplorer](https://testnet.monadexplorer.com/address/0x5222A33A4CaBC993F8354b9fCfD753Cc8C1439FA) |

---

## Inspiration & The Problem We Solve
Autonomous AI agents are the primary consumers of high-throughput blockchains. However, existing onchain agent architectures face critical roadblocks that recent agent hackathon winners (T3tris, Advance, Cassie) proved must be solved:
1. **The Capital Allocation Problem (T3tris):** Who gives an agent money? Exposing a personal hot wallet with raw private keys invites drain attacks. Operon implements **permissionless liquidity vaults** where human depositors earn yield while smart contracts programmatically isolate principal.
2. **The Agent Borrowing & Credit Problem (Advance):** Instead of uncontrolled spending, Operon issues **continuous bounded credit lines** to agents, enforced directly on Monad.
3. **The Blind Signing Danger (Cassie):** Operon guarantees strict **pre-signing order validation**: spend caps, destination whitelisting, and an immediate biometric **Circuit Breaker** halt onchain execution before funds can be touched.

Operon Protocol unites these winning primitives with **Mera-style "One Passkey, Many Keys" biometric delegation** and **Monad's 10,000 TPS parallel EVM execution**:
- Users onboard via native WebAuthn (Touch ID, Face ID, Windows Hello).
- The master passkey governs permissionless vaults (`OperonAgentVault.sol`) and grants **ephemeral, policy-bounded sub-keys** to registered **ERC-8004 autonomous agents**.
- Agents borrow within strictly bounded credit quotas and broadcast parallel transactions to Monad with sub-second finality.
- 80% of net profits accrue to vault depositors; 20% performance fee routes to the agent operator.
- If an anomaly occurs, the user trips an **Emergency Circuit Breaker** with a single biometric gesture, instantly freezing vault borrowing and execution onchain.

---

## System Architecture

```mermaid
graph TD
    subgraph Client ["Client Interface (Next.js / Viem)"]
        Passkey["Master WebAuthn Passkey<br/>(P256 / TouchID / Windows Hello)"]
        VaultUI["Agent Vault Deck<br/>(Deposits, Yield, Credit Lines)"]
        PolicyUI["Policy Console<br/>(Spend Caps, Whitelists, Circuit Breaker)"]
        Dashboard["60 FPS Telemetry Visualizer<br/>(Live Monad Explorer Links)"]
    end

    subgraph Contracts ["Monad Testnet EVM (Chain ID 10143)"]
        Vault["OperonAgentVault.sol<br/>(Permissionless Pool & Credit Lines)"]
        PolicyMgr["OperonPolicyManager.sol<br/>(Session Verification & Spend Envelopes)"]
        Registry["OperonRegistryERC8004.sol<br/>(Agent Identity & Reputation Ledger)"]
        DEX["TestOrderBook.sol<br/>(High-Throughput Parallel Trading Target)"]
    end

    subgraph Agent ["Autonomous Agent Operator"]
        SessionKey["Ephemeral Session Key<br/>(ECDSA Keypair in Memory)"]
        LLM["AI Decision Engine<br/>(Structured Tool-Calling)"]
        ViemRunner["Viem Broadcaster<br/>(Sub-Second Monad Testnet RPC)"]
    end

    Passkey -->|Authorizes Policy| PolicyMgr
    VaultUI -->|Deposits MON| Vault
    Vault -->|Borrows Credit| PolicyMgr
    PolicyUI -->|Derives Sub-Key| SessionKey
    LLM -->|Evaluates State| ViemRunner
    SessionKey -->|Signs Execution Envelope| ViemRunner
    ViemRunner -->|executeWithVaultCredit()| PolicyMgr
    PolicyMgr -->|Routes Credit Trade| DEX
    PolicyMgr -->|Updates Reputation| Registry
    PolicyMgr -.->|Live Receipts| Dashboard
```

---

## 🏆 Hackathon Tracks & Sponsor Alignment

| Target Track / Bounty | Sponsor Tech Used | Implementation Details |
| :--- | :--- | :--- |
| **Track 04: Trust, Identity & AI Infrastructure** | Monad Foundation | Primary submission. Implements ERC-8004 onchain agent identity, reputation scoring, and passkey delegation. |
| **Mera: One Passkey, Many Keys** ($2,500) | Mera | Master WebAuthn passkey governs multiple scoped sub-agent keys with individual spend limits and whitelists. |
| **Mera: Best Agent Wallet Plugin** ($2,500) | Mera | Reusable agent execution envelope signing module (`sessionKeys.ts`). |
| **Mera: Best Mera-Powered UX** ($2,500) | Mera | Zero-seed-phrase, biometric-native UI with tactile feedback. |
| **Kuru: Consumer Trading App Bounty** ($5,000) | Kuru DEX | Agents execute high-frequency limit orders and grid rebalancing on onchain orderbook. |
| **Privy / Dynamic Embedded Auth** ($5,000) | Privy / Dynamic | Native WebAuthn P-256 key registration without extension dependencies. |
| **Envio: Best Use of Envio** ($1,000) | Envio | Real-time event streaming and execution replay for live telemetry. |

---

## 🔬 Benchmark Hackathon Primitives (Synthesized for Monad)

Operon synthesizes the winning architectures of **Runtime Agent Week** and **ETHOnline 2026** into a unified high-throughput infrastructure on Monad:

| Benchmark Primitive | Original Winner | Operon Implementation on Monad |
| :--- | :--- | :--- |
| **Permissionless Liquidity Vault** | T3tris ($8,000 Grand Prize) | `OperonAgentVault.sol` allows community depositors to earn 80% yield from agent trading while curators harvest a 20% performance fee via `claimPerformanceFee()`. |
| **Bounded Agent Credit Lines** | Advance (Uniswap & Dynamic 1st) | Agents draw bounded working capital (`borrowAgentCredit()`) up to an onchain credit quota rather than holding unlocked reserves. |
| **Downward Narrowing & Hierarchical Sub-Agents** | Cordon (ETHOnline 2026 Finalist) | `delegateSubMandate()` enforces that child sub-agents receive strictly narrower spending caps, expiry times, and contract whitelists than their parent agents. |
| **Ancestor Debits** | Cordon (`TreeVault.sol`) | `_debitAncestors()` ensures any draw by a leaf worker automatically charges and decrements the headroom of ancestor nodes up to the root passkey. |
| **Onchain Revert Defense & Conduct Records** | Advance & Cordon | Hardware/EVM locks sit below the model: rogue or prompt-injected agents attempting unauthorized calls revert onchain (`attemptAdversarialExecution()`) and emit immutable `PolicyViolationRecorded` events slashes to their ERC-8004 reputation. |
| **Pre-Flight Policy Inspector** | Cassie (Flash Rail 1st) | Dynamic verification of contract whitelists, spend cap headroom, and slippage before transaction envelopes are signed and broadcast. |
| **Multi-Point Risk Firewall** | Truvian Shield (Telegraph Hackathon 2nd) | `evaluateTruvianRisk()` evaluates instantaneous Value-at-Risk (VaR), mempool gas spikes, and counterparty reputation before permitting credit-backed execution. |
| **Machine-Callable Decoded Intelligence** | TXlens (Telegraph Hackathon 1st) | Real-time decoded contract methods, parameter extraction, and execution lane provenance rendered in the telemetry stream. |
| **Parallel EVM High Throughput** | *Monad Exclusive* | 4 concurrent execution lanes dispatched across parallel state access points with sub-400ms finality and 60 FPS compositor acceleration. |

---

## 🛡️ The Zero-Mock Law
Enshrined in [`GEMINI.md`](./GEMINI.md), this project strictly forbids synthetic mock arrays, fake timeouts (`setTimeout`), or simulated data:
- **Real Smart Contracts:** `OperonPolicyManager`, `OperonRegistryERC8004`, `OperonAgentVault`, and `TestOrderBook` are compiled and deployed to Monad Testnet.
- **Real Biometric Signatures:** Authentication utilizes browser WebAuthn API credentials.
- **Real Ephemeral Signers:** Session keys are genuine cryptographic keypairs signing standard EIP-191/EIP-712 messages.
- **Real Monad Transactions:** All telemetry entries represent confirmed blocks on `testnet.monadexplorer.com`.

---

## 📦 Project Structure

```
├── contracts/               # Hardhat + Viem smart contract suite (Cancun EVM)
│   ├── contracts/
│   │   ├── OperonPolicyManager.sol   # Session key, narrowing & policy governor
│   │   ├── OperonAgentVault.sol      # T3tris vault & Advance credit engine
│   │   ├── OperonRegistryERC8004.sol # ERC-8004 agent identity & ConductRecords
│   │   ├── TestOrderBook.sol         # Parallel onchain orderbook (Kuru DEX)
│   │   └── TestMON.sol               # Self-minting test token
│   ├── scripts/deploy.js             # Deployment automation
│   ├── test/OperonProtocol.test.ts   # Core engine test suite
│   ├── test/OperonVault.test.ts      # Vault, narrowing & revert defense test suite (8 passing)
│   └── hardhat.config.ts             # Monad Testnet config (Chain 10143)
├── web/                     # Next.js 14 frontend application
│   ├── src/
│   │   ├── app/page.tsx              # Split-screen terminal & visualizer
│   │   ├── components/Header.tsx     # Biometric auth & live Monad block ticker
│   │   ├── components/AgentVaultDeck.tsx # T3tris LP & Advance credit dashboard
│   │   ├── components/KeyDelegationTopology.tsx # Cordon hierarchical agent tree
│   │   ├── components/ParallelExecutionCanvas.tsx # 60 FPS compositor canvas
│   │   ├── components/PolicyConsole.tsx # Biometric passkey & spend caps
│   │   ├── components/AgentTerminal.tsx # Adversarial hijack & Cassie pre-flight inspector
│   │   ├── components/TelemetryVisualizer.tsx # Sub-second finality verified receipts
│   │   ├── lib/webauthn.ts           # WebAuthn P256 passkey handler
│   │   ├── lib/sessionKeys.ts        # Ephemeral session key generator
│   │   └── lib/agentRunner.ts        # Autonomous agent execution loop
├── agent/                   # Standalone TypeScript agent runner daemon
│   └── src/runner.ts
├── GEMINI.md                # Permanent project rules & Zero-Mock Law
└── README.md                # Submission documentation
```

---

## 🚀 Quickstart & Reproduction

### Prerequisites
- Node.js `>= 18.0.0`
- pnpm `>= 9.0.0`

### 1. Compile & Test Smart Contracts
```bash
cd contracts
node ./node_modules/hardhat/internal/cli/cli.js compile
node ./node_modules/hardhat/internal/cli/cli.js test
```

### 2. Deploy Contracts
```bash
# Local testnet deployment:
node ./node_modules/hardhat/internal/cli/cli.js run scripts/deploy.js

# Monad Testnet deployment:
PRIVATE_KEY="your_private_key" node ./node_modules/hardhat/internal/cli/cli.js run scripts/deploy.js --network monadTestnet
```

### 3. Launch Frontend Dashboard
```bash
cd web
pnpm run dev
```
Open `http://localhost:3000` to interact with the live Operon dashboard.

---

## 🎬 90-Second Demo Click-Path
1. **0:00 - 0:15:** Click "Connect Master Passkey". Authenticate with Face ID / Touch ID / Windows Hello in 2 seconds.
2. **0:15 - 0:35:** In the Policy Console, select "Kuru Arbitrage Sentinel", set spend cap to 1.0 MON, and authorize the sub-key with passkey biometric.
3. **0:35 - 0:55:** In the Agent Terminal, submit intent: *"Place concurrent limit orders on Monad TestOrderBook"*. The agent reasons live and broadcasts transactions via session key.
4. **0:55 - 1:15:** Observe the Telemetry Visualizer: Monad confirms transactions in ~400ms. Click the explorer icon to inspect the verified transaction on `testnet.monadexplorer.com`.
5. **1:15 - 1:30:** Click "Trip Circuit Breaker": Instant freeze halts further execution onchain, verifying zero-breach safety.
