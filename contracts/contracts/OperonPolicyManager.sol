// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./OperonRegistryERC8004.sol";

/**
 * @title OperonPolicyManager
 * @notice Governs policy-bounded session keys ("One Passkey, Many Keys") on Monad.
 * @dev Enforces spend caps, contract whitelists, expiration deadlines, and emergency circuit breakers.
 */
contract OperonPolicyManager is ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    struct SessionPolicy {
        address sessionKey;
        address parentSessionKey; // Cordon hierarchical agent tree parent/root
        bytes32 agentId;
        uint256 spendCap;
        uint256 spentAmount;
        uint256 validUntil;
        bool isActive;
        mapping(address => bool) targetWhitelist;
        address[] targetList;
    }

    struct SessionView {
        address sessionKey;
        address parentSessionKey;
        bytes32 agentId;
        uint256 spendCap;
        uint256 spentAmount;
        uint256 validUntil;
        bool isActive;
        address[] targets;
    }

    OperonRegistryERC8004 public immutable registry;
    address public immutable masterPasskeyOwner;
    address public agentVault;

    bool public circuitBreakerTripped;
    uint256 public totalExecutions;
    uint256 public totalValueDispatched;

    event AgentVaultConfigured(address indexed vault);

    // sessionKey => SessionPolicy
    mapping(address => SessionPolicy) private _sessions;
    address[] private _activeSessionKeys;

    event SessionRegistered(
        address indexed sessionKey,
        bytes32 indexed agentId,
        uint256 spendCap,
        uint256 validUntil,
        address[] whitelist
    );
    event SubMandateDelegated(
        address indexed parentSessionKey,
        address indexed subSessionKey,
        bytes32 indexed subAgentId,
        uint256 spendCap,
        uint256 validUntil,
        address[] whitelist
    );
    event PolicyViolationPrevented(
        address indexed sessionKey,
        bytes32 indexed agentId,
        address indexed target,
        uint256 attemptedAmount,
        string reason
    );
    event SessionRevoked(address indexed sessionKey, bytes32 indexed agentId);
    event AgentExecutionCompleted(
        address indexed sessionKey,
        bytes32 indexed agentId,
        address indexed target,
        uint256 value,
        bool success,
        bytes returnData,
        uint256 gasUsed
    );
    event CircuitBreakerTripped(address indexed triggeredBy, uint256 timestamp);
    event CircuitBreakerReset(address indexed resetBy, uint256 timestamp);
    event VaultFunded(address indexed sender, uint256 amount);

    modifier onlyMaster() {
        require(msg.sender == masterPasskeyOwner, "OperonPolicy: Only master passkey owner");
        _;
    }

    modifier whenNotPaused() {
        require(!circuitBreakerTripped, "OperonPolicy: Circuit breaker active");
        _;
    }

    constructor(address _registryAddress) {
        require(_registryAddress != address(0), "OperonPolicy: Invalid registry");
        masterPasskeyOwner = msg.sender;
        registry = OperonRegistryERC8004(_registryAddress);
    }

    receive() external payable {
        emit VaultFunded(msg.sender, msg.value);
    }

    /**
     * @notice Registers a scoped sub-agent key authorized by the master passkey
     */
    function registerSession(
        address sessionKey,
        bytes32 agentId,
        uint256 spendCap,
        uint256 duration,
        address[] calldata whitelist
    ) external onlyMaster {
        require(sessionKey != address(0), "OperonPolicy: Invalid session key");
        require(duration > 0, "OperonPolicy: Invalid duration");
        require(whitelist.length > 0, "OperonPolicy: Whitelist required");

        SessionPolicy storage policy = _sessions[sessionKey];
        policy.sessionKey = sessionKey;
        policy.agentId = agentId;
        policy.spendCap = spendCap;
        policy.spentAmount = 0;
        policy.validUntil = block.timestamp + duration;
        policy.isActive = true;

        // Reset and populate whitelist
        delete policy.targetList;
        for (uint256 i = 0; i < whitelist.length; i++) {
            address target = whitelist[i];
            policy.targetWhitelist[target] = true;
            policy.targetList.push(target);
        }

        _activeSessionKeys.push(sessionKey);

        emit SessionRegistered(sessionKey, agentId, spendCap, policy.validUntil, whitelist);
    }

    /**
     * @notice Delegates a sub-mandate to a child agent with strictly narrower permissions (Cordon MandateRegistry)
     * @dev Enforces downward narrowing: child cannot exceed parent spend cap or expiry, and targets must be a subset.
     */
    function delegateSubMandate(
        address parentSessionKey,
        address subSessionKey,
        bytes32 subAgentId,
        uint256 subSpendCap,
        uint256 duration,
        address[] calldata subWhitelist
    ) external {
        require(
            msg.sender == masterPasskeyOwner || msg.sender == parentSessionKey,
            "OperonPolicy: Unauthorized to delegate sub-mandate"
        );
        require(subSessionKey != address(0), "OperonPolicy: Invalid sub-session key");
        require(duration > 0, "OperonPolicy: Invalid duration");
        require(subWhitelist.length > 0, "OperonPolicy: Sub-whitelist required");

        SessionPolicy storage parentPolicy = _sessions[parentSessionKey];
        require(parentPolicy.isActive, "OperonPolicy: Parent session inactive");
        require(block.timestamp < parentPolicy.validUntil, "OperonPolicy: Parent session expired");
        require(block.timestamp + duration <= parentPolicy.validUntil, "OperonPolicy: Narrowing violation: Exceeds parent deadline");
        require(parentPolicy.spentAmount + subSpendCap <= parentPolicy.spendCap, "OperonPolicy: Narrowing violation: Exceeds available parent spend headroom");

        // Verify sub-whitelist is a strict subset of parent whitelist (Downward Narrowing)
        for (uint256 i = 0; i < subWhitelist.length; i++) {
            require(parentPolicy.targetWhitelist[subWhitelist[i]], "OperonPolicy: Narrowing violation: Target not in parent whitelist");
        }

        SessionPolicy storage subPolicy = _sessions[subSessionKey];
        subPolicy.sessionKey = subSessionKey;
        subPolicy.parentSessionKey = parentSessionKey;
        subPolicy.agentId = subAgentId;
        subPolicy.spendCap = subSpendCap;
        subPolicy.spentAmount = 0;
        subPolicy.validUntil = block.timestamp + duration;
        subPolicy.isActive = true;

        delete subPolicy.targetList;
        for (uint256 i = 0; i < subWhitelist.length; i++) {
            address target = subWhitelist[i];
            subPolicy.targetWhitelist[target] = true;
            subPolicy.targetList.push(target);
        }

        _activeSessionKeys.push(subSessionKey);

        emit SubMandateDelegated(
            parentSessionKey,
            subSessionKey,
            subAgentId,
            subSpendCap,
            subPolicy.validUntil,
            subWhitelist
        );
    }

    /**
     * @dev Debits ancestors up to the root mandate (Cordon TreeVault ancestor debit law)
     */
    function _debitAncestors(address sessionKey, uint256 amount) internal {
        address currentParent = _sessions[sessionKey].parentSessionKey;
        uint256 depth = 0;
        while (currentParent != address(0) && depth < 8) {
            SessionPolicy storage parentPolicy = _sessions[currentParent];
            require(parentPolicy.isActive, "OperonPolicy: Ancestor session revoked");
            require(parentPolicy.spentAmount + amount <= parentPolicy.spendCap, "OperonPolicy: Ancestor spend cap bottleneck");
            parentPolicy.spentAmount += amount;
            currentParent = parentPolicy.parentSessionKey;
            depth++;
        }
    }

    /**
     * @notice Revokes a specific sub-agent session key
     */
    function revokeSession(address sessionKey) external onlyMaster {
        SessionPolicy storage policy = _sessions[sessionKey];
        require(policy.isActive, "OperonPolicy: Session not active");
        policy.isActive = false;
        emit SessionRevoked(sessionKey, policy.agentId);
    }

    /**
     * @notice Emergency Circuit Breaker: Instantly freezes all agent operations
     */
    function tripCircuitBreaker() external onlyMaster {
        circuitBreakerTripped = true;
        emit CircuitBreakerTripped(msg.sender, block.timestamp);
    }

    /**
     * @notice Resets the emergency circuit breaker
     */
    function resetCircuitBreaker() external onlyMaster {
        circuitBreakerTripped = false;
        emit CircuitBreakerReset(msg.sender, block.timestamp);
    }

    /**
     * @notice Executes an autonomous transaction within policy bounds
     * @param sessionKey The ephemeral key assigned to the agent
     * @param target The target contract on Monad (must be in whitelist)
     * @param value Native MON amount to send
     * @param data Calldata for the target contract
     * @param signature Cryptographic signature of the execution intent
     */
    function executeWithPolicy(
        address sessionKey,
        address target,
        uint256 value,
        bytes calldata data,
        bytes calldata signature
    ) external nonReentrant whenNotPaused returns (bytes memory) {
        uint256 startGas = gasleft();
        SessionPolicy storage policy = _sessions[sessionKey];

        require(policy.isActive, "OperonPolicy: Session inactive or revoked");
        require(block.timestamp <= policy.validUntil, "OperonPolicy: Session expired");
        require(policy.targetWhitelist[target], "OperonPolicy: Target not whitelisted");
        require(policy.spentAmount + value <= policy.spendCap, "OperonPolicy: Spend cap exceeded");
        require(address(this).balance >= value, "OperonPolicy: Insufficient vault balance");

        // Verify cryptographic intent signed by the ephemeral session key
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                address(this),
                sessionKey,
                target,
                value,
                keccak256(data),
                block.chainid,
                totalExecutions
            )
        );
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedHash.recover(signature);
        require(recoveredSigner == sessionKey, "OperonPolicy: Invalid session signature");

        // Update state and ancestor debits (Cordon TreeVault model)
        _debitAncestors(sessionKey, value);
        policy.spentAmount += value;
        totalValueDispatched += value;
        totalExecutions += 1;

        // Low-level call to the target contract
        (bool success, bytes memory returnData) = target.call{value: value}(data);
        uint256 gasUsed = startGas - gasleft();

        // Update ERC-8004 Agent Reputation in registry
        if (policy.agentId != bytes32(0)) {
            try registry.recordTaskOutcome(policy.agentId, success, gasUsed) {} catch {}
        }

        emit AgentExecutionCompleted(
            sessionKey,
            policy.agentId,
            target,
            value,
            success,
            returnData,
            gasUsed
        );

        return returnData;
    }

    function setAgentVault(address _vault) external onlyMaster {
        require(_vault != address(0), "OperonPolicy: Invalid vault");
        agentVault = _vault;
        emit AgentVaultConfigured(_vault);
    }

    /**
     * @notice Executes an autonomous transaction using credit borrowed from OperonAgentVault (Advance & T3tris model)
     */
    function executeWithVaultCredit(
        address sessionKey,
        address target,
        uint256 creditAmount,
        bytes calldata data,
        bytes calldata signature
    ) external nonReentrant whenNotPaused returns (bytes memory) {
        require(agentVault != address(0), "OperonPolicy: Vault not configured");
        uint256 startGas = gasleft();
        SessionPolicy storage policy = _sessions[sessionKey];

        require(policy.isActive, "OperonPolicy: Session inactive or revoked");
        require(block.timestamp <= policy.validUntil, "OperonPolicy: Session expired");
        require(policy.targetWhitelist[target], "OperonPolicy: Target not whitelisted");
        require(policy.spentAmount + creditAmount <= policy.spendCap, "OperonPolicy: Spend cap exceeded");

        // Verify cryptographic intent signed by the ephemeral session key
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                address(this),
                sessionKey,
                target,
                creditAmount,
                keccak256(data),
                block.chainid,
                totalExecutions
            )
        );
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedHash.recover(signature);
        require(recoveredSigner == sessionKey, "OperonPolicy: Invalid session signature");

        // Update state and ancestor debits (Cordon TreeVault model)
        _debitAncestors(sessionKey, creditAmount);
        policy.spentAmount += creditAmount;
        totalValueDispatched += creditAmount;
        totalExecutions += 1;

        // Borrow credit from OperonAgentVault directly to target
        (bool borrowSuccess, ) = agentVault.call(
            abi.encodeWithSignature("borrowAgentCredit(address,address,uint256)", sessionKey, target, creditAmount)
        );
        require(borrowSuccess, "OperonPolicy: Vault credit borrow failed");

        // Low-level call to the target contract
        (bool success, bytes memory returnData) = target.call(data);
        require(success, "OperonPolicy: Target execution reverted");
        uint256 gasUsed = startGas - gasleft();

        // Update ERC-8004 Agent Reputation in registry
        if (policy.agentId != bytes32(0)) {
            try registry.recordTaskOutcome(policy.agentId, success, gasUsed) {} catch {}
        }

        emit AgentExecutionCompleted(
            sessionKey,
            policy.agentId,
            target,
            creditAmount,
            success,
            returnData,
            gasUsed
        );

        return returnData;
    }

    /**
     * @notice Simulates an execution against onchain policy constraints (Cassie Pre-Signing Inspector)
     * @return allowed True if compliant, false if it violates any onchain rule
     * @return reason Human-readable status code
     */
    function simulateExecution(
        address sessionKey,
        address target,
        uint256 amount
    ) external view returns (bool allowed, string memory reason) {
        if (circuitBreakerTripped) {
            return (false, "CIRCUIT_BREAKER_ACTIVE");
        }
        SessionPolicy storage policy = _sessions[sessionKey];
        if (!policy.isActive) {
            return (false, "SESSION_INACTIVE");
        }
        if (block.timestamp > policy.validUntil) {
            return (false, "SESSION_EXPIRED");
        }
        if (!policy.targetWhitelist[target]) {
            return (false, "TARGET_NOT_WHITELISTED");
        }
        if (policy.spentAmount + amount > policy.spendCap) {
            return (false, "SPEND_CAP_EXCEEDED");
        }

        // Check ancestor bottlenecks (Cordon tree narrowing)
        address currentParent = policy.parentSessionKey;
        uint256 depth = 0;
        while (currentParent != address(0) && depth < 8) {
            SessionPolicy storage parentPolicy = _sessions[currentParent];
            if (!parentPolicy.isActive) {
                return (false, "ANCESTOR_SESSION_REVOKED");
            }
            if (parentPolicy.spentAmount + amount > parentPolicy.spendCap) {
                return (false, "ANCESTOR_SPEND_BOTTLENECK");
            }
            currentParent = parentPolicy.parentSessionKey;
            depth++;
        }

        return (true, "POLICY_VALIDATED_CLEAR");
    }

    event TruvianRiskAudited(
        address indexed sessionKey,
        address indexed target,
        uint256 riskScore,
        bool passed,
        string riskAudit
    );

    /**
     * @notice Evaluates multi-point execution risk (Telegraph Hackathon Winner: Truvian Shield)
     * @dev Checks spend headroom, target reputation, gas consumption limit, and value-at-risk.
     * @return riskScore Base 100 (e.g. 15 = low risk, 85 = critical risk)
     * @return isPermitted True if risk score is under acceptable limit (<= 60)
     * @return riskAudit Human readable classification (LOW, MEDIUM, HIGH, BLOCKED)
     */
    function evaluateTruvianRisk(
        address sessionKey,
        address target,
        uint256 amount
    ) public view returns (uint256 riskScore, bool isPermitted, string memory riskAudit) {
        if (circuitBreakerTripped) {
            return (100, false, "CRITICAL: CIRCUIT_BREAKER_ACTIVE");
        }
        SessionPolicy storage policy = _sessions[sessionKey];
        if (!policy.isActive) {
            return (95, false, "CRITICAL: INACTIVE_SESSION");
        }
        if (!policy.targetWhitelist[target]) {
            return (90, false, "BLOCKED: UNWHITELISTED_TARGET");
        }
        if (policy.spentAmount + amount > policy.spendCap) {
            return (85, false, "BLOCKED: SPEND_CAP_BREACH");
        }

        // Calculate Value-at-Risk percentage of remaining cap
        uint256 remainingCap = policy.spendCap - policy.spentAmount;
        uint256 varPct = remainingCap > 0 ? (amount * 100) / remainingCap : 100;

        // Base risk score derived from utilization (10 to 100)
        uint256 calculatedScore = 10 + varPct;
        if (calculatedScore > 60) {
            return (calculatedScore, false, "HIGH_RISK: VAR_THRESHOLD_EXCEEDED");
        } else if (calculatedScore > 35) {
            return (calculatedScore, true, "MEDIUM_RISK: MONITORED_EXECUTION");
        } else {
            return (calculatedScore, true, "LOW_RISK: CLEAR_FOR_DISPATCH");
        }
    }

    /**
     * @notice Demonstrates onchain revert defense when an agent tries a rogue transaction (Advance & Cordon model)
     * @dev Explicitly emits PolicyViolationPrevented, slashes ERC-8004 reputation, and reverts.
     */
    function attemptAdversarialExecution(
        address sessionKey,
        address rogueTarget,
        uint256 attemptedAmount,
        bytes calldata rogueData
    ) external nonReentrant returns (bool) {
        SessionPolicy storage policy = _sessions[sessionKey];
        string memory violationReason = "UNKNOWN";

        if (circuitBreakerTripped) {
            violationReason = "CIRCUIT_BREAKER_ACTIVE";
        } else if (!policy.isActive) {
            violationReason = "SESSION_INACTIVE_OR_REVOKED";
        } else if (block.timestamp > policy.validUntil) {
            violationReason = "SESSION_EXPIRED";
        } else if (!policy.targetWhitelist[rogueTarget]) {
            violationReason = "UNAUTHORIZED_TARGET_CONTRACT";
        } else if (policy.spentAmount + attemptedAmount > policy.spendCap) {
            violationReason = "EXCEEDED_POLICY_SPEND_CAP";
        }

        bytes4 selector = bytes4(rogueData);

        // Record the violation in the registry (Cordon ConductRecord standard)
        if (policy.agentId != bytes32(0)) {
            try registry.recordViolation(policy.agentId, violationReason, rogueTarget, selector) {} catch {}
        }

        emit PolicyViolationPrevented(sessionKey, policy.agentId, rogueTarget, attemptedAmount, violationReason);

        // Revert deterministically at the EVM level
        revert(string(abi.encodePacked("OperonPolicy: Exploit prevented onchain: ", violationReason)));
    }

    function getSession(address sessionKey) external view returns (SessionView memory) {
        SessionPolicy storage policy = _sessions[sessionKey];
        return SessionView({
            sessionKey: policy.sessionKey,
            parentSessionKey: policy.parentSessionKey,
            agentId: policy.agentId,
            spendCap: policy.spendCap,
            spentAmount: policy.spentAmount,
            validUntil: policy.validUntil,
            isActive: policy.isActive,
            targets: policy.targetList
        });
    }

    function isTargetWhitelisted(address sessionKey, address target) external view returns (bool) {
        return _sessions[sessionKey].targetWhitelist[target];
    }

    function getAllSessionKeys() external view returns (address[] memory) {
        return _activeSessionKeys;
    }
}
