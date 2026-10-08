# Project Governance & Ironclad Rules: Operon Protocol on Monad

## Mandatory Rule: Absolute Zero-Mock / Zero-Hardcoded Data Law

Under no circumstances may any component, module, or user-facing interface in this project use mock data, hardcoded placeholder arrays, simulated latency timeouts (`setTimeout`), or fake transactions.

### 1. Smart Contracts
- All smart contracts (`OperonPolicyManager`, `OperonRegistryERC8004`, test liquidity vaults, and tokens) must be compiled and deployed live to Monad Testnet.
- Every contract address displayed or referenced must be real, live, and inspectable on `testnet.monadexplorer.com`.

### 2. Authentication & Keys
- Passkeys must use real browser WebAuthn / P256 credentials (`navigator.credentials.create` / `get` or live Mera/Privy passkeys).
- Ephemeral session keys must be genuine ECDSA/P256 cryptographic keypairs generated client-side, authorized onchain, and used to sign real EVM transactions.

### 3. Agent Intelligence & Execution
- The autonomous agent must execute real LLM tool-calling inference loops (e.g., Qwen / OpenAI / Anthropic / Groq).
- Transaction payloads must be constructed from real market state queried via Monad JSON-RPC.
- Transactions must be broadcast live to the Monad Testnet mempool via `viem` / `ethers`, paying real testnet gas and producing real onchain transaction hashes (`0x...`).

### 4. Telemetry & Frontend State
- All balances, transaction histories, block heights, and agent telemetry feeds must be derived exclusively from live RPC state queries and onchain event listeners (Envio Hypersync or Viem event streams).
- Every transaction displayed in the UI must have a working, direct hyperlink to the Monad Testnet block explorer.
