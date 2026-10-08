// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./OperonPolicyManager.sol";

/**
 * @title OperonAgentVault
 * @notice Permissionless Agent Liquidity Vault & Credit Line Engine on Monad.
 * @dev Combines T3tris (permissionless vaults for agents), Advance (agent credit borrowing),
 *      and Cassie (pre-signing safety & circuit breaker halting).
 */
contract OperonAgentVault is ReentrancyGuard {
    OperonPolicyManager public immutable policyManager;
    address public immutable vaultManager;

    string public name = "Operon Agent Liquidity Vault";
    string public symbol = "opVAULT";

    uint256 public totalShares;
    mapping(address => uint256) public shareBalance;

    // Agent credit allocation limits
    uint256 public maxAgentCreditQuota; // In wei (native MON)
    uint256 public activeAgentBorrows;   // Total borrowed and currently outstanding

    // Performance fee configuration (in basis points, e.g. 2000 = 20%)
    uint256 public constant PERFORMANCE_FEE_BPS = 2000;
    uint256 public constant BPS_DENOMINATOR = 10000;

    // Historical tracking
    uint256 public totalProfitsDistributed;
    uint256 public totalBorrowedCumulative;

    event Deposited(address indexed depositor, uint256 amount, uint256 sharesMinted);
    event Withdrawn(address indexed depositor, uint256 amount, uint256 sharesBurned);
    event AgentCreditBorrowed(address indexed sessionKey, address indexed target, uint256 amount);
    event AgentCreditRepaid(address indexed sessionKey, uint256 principalRepaid, uint256 profitGenerated);
    event AgentCreditQuotaUpdated(uint256 newQuota);

    modifier onlyVaultManager() {
        require(msg.sender == vaultManager, "OperonVault: Only vault manager");
        _;
    }

    modifier whenNotHalted() {
        require(!policyManager.circuitBreakerTripped(), "OperonVault: Emergency circuit breaker engaged");
        _;
    }

    constructor(address payable _policyManager) {
        require(_policyManager != address(0), "OperonVault: Invalid policy manager");
        policyManager = OperonPolicyManager(_policyManager);
        vaultManager = msg.sender;
        // Default agent credit line quota: 5.0 MON
        maxAgentCreditQuota = 5 ether;
    }

    receive() external payable {}

    /**
     * @notice Total liquidity held by the vault (idle balance + active agent borrows)
     */
    function totalAssets() public view returns (uint256) {
        return address(this).balance + activeAgentBorrows;
    }

    /**
     * @notice Deposit native MON into the vault to earn agent trading yield (T3tris model)
     */
    function deposit() external payable nonReentrant whenNotHalted returns (uint256 shares) {
        require(msg.value > 0, "OperonVault: Zero deposit");

        uint256 poolAssetsBefore = totalAssets() - msg.value;
        if (totalShares == 0 || poolAssetsBefore == 0) {
            shares = msg.value;
        } else {
            shares = (msg.value * totalShares) / poolAssetsBefore;
        }

        require(shares > 0, "OperonVault: Shares minted is zero");
        shareBalance[msg.sender] += shares;
        totalShares += shares;

        emit Deposited(msg.sender, msg.value, shares);
    }

    /**
     * @notice Withdraw deposited MON and accrued agent yield
     */
    function withdraw(uint256 shares) external nonReentrant returns (uint256 payout) {
        require(shares > 0, "OperonVault: Zero shares");
        require(shareBalance[msg.sender] >= shares, "OperonVault: Insufficient shares");

        payout = (shares * address(this).balance) / totalShares;
        require(payout > 0, "OperonVault: Insufficient payout");
        require(address(this).balance >= payout, "OperonVault: Liquidity locked in active trades");

        shareBalance[msg.sender] -= shares;
        totalShares -= shares;

        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "OperonVault: MON transfer failed");

        emit Withdrawn(msg.sender, payout, shares);
    }

    /**
     * @notice Borrow credit from the vault for autonomous agent execution on Monad (Advance model)
     * @dev Validates against creditQuota, available idle liquidity, and circuit breaker.
     */
    function borrowAgentCredit(
        address sessionKey,
        address target,
        uint256 amount
    ) external nonReentrant whenNotHalted returns (bool) {
        // Only the policy manager can authorize agent borrows
        require(msg.sender == address(policyManager), "OperonVault: Only policy manager can borrow");
        require(activeAgentBorrows + amount <= maxAgentCreditQuota, "OperonVault: Exceeds credit quota");
        require(address(this).balance >= amount, "OperonVault: Insufficient idle vault balance");

        activeAgentBorrows += amount;
        totalBorrowedCumulative += amount;

        (bool success, ) = payable(target).call{value: amount}("");
        require(success, "OperonVault: Agent capital transfer failed");

        emit AgentCreditBorrowed(sessionKey, target, amount);
        return true;
    }

    /**
     * @notice Repays borrowed agent capital back to the vault with generated trading profits
     */
    uint256 public accruedPerformanceFees;
    event PerformanceFeeClaimed(address indexed recipient, uint256 amount);

    function repayAgentCredit(
        address sessionKey,
        uint256 principalRepaid
    ) external payable nonReentrant {
        require(msg.value >= principalRepaid, "OperonVault: Incomplete principal repayment");
        require(activeAgentBorrows >= principalRepaid, "OperonVault: Repaying more than borrowed");

        activeAgentBorrows -= principalRepaid;
        uint256 profit = msg.value - principalRepaid;

        if (profit > 0) {
            uint256 agentFee = (profit * PERFORMANCE_FEE_BPS) / BPS_DENOMINATOR;
            uint256 vaultYield = profit - agentFee;

            totalProfitsDistributed += vaultYield;
            accruedPerformanceFees += agentFee;
        }

        emit AgentCreditRepaid(sessionKey, principalRepaid, profit);
    }

    /**
     * @notice Claims accrued performance fees earned by autonomous agent curation (T3tris model)
     */
    function claimPerformanceFee() external nonReentrant returns (uint256 amount) {
        address recipient = policyManager.masterPasskeyOwner();
        require(msg.sender == recipient || msg.sender == vaultManager, "OperonVault: Unauthorized fee claim");
        amount = accruedPerformanceFees;
        require(amount > 0, "OperonVault: No fees accrued");
        require(address(this).balance >= amount, "OperonVault: Insufficient balance");

        accruedPerformanceFees = 0;
        (bool feeSent, ) = payable(recipient).call{value: amount}("");
        require(feeSent, "OperonVault: Fee payout failed");

        emit PerformanceFeeClaimed(recipient, amount);
    }

    /**
     * @notice Live AUM and telemetry metrics for frontend state
     */
    function getVaultMetrics() external view returns (
        uint256 totalAUM,
        uint256 availableIdle,
        uint256 activeBorrows,
        uint256 creditQuota,
        uint256 distributedYield,
        uint256 claimableFees
    ) {
        return (
            totalAssets(),
            address(this).balance,
            activeAgentBorrows,
            maxAgentCreditQuota,
            totalProfitsDistributed,
            accruedPerformanceFees
        );
    }

    /**
     * @notice Update max agent credit borrowing quota
     */
    function setAgentCreditQuota(uint256 newQuota) external onlyVaultManager {
        maxAgentCreditQuota = newQuota;
        emit AgentCreditQuotaUpdated(newQuota);
    }
}
