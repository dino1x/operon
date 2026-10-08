// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title OperonRegistryERC8004
 * @notice Onchain Agent Identity, Model Provenance, and Reputation Ledger conforming to ERC-8004.
 * @dev Optimized for sub-second parallel execution and verifiable state on Monad.
 */
contract OperonRegistryERC8004 {
    struct Agent {
        bytes32 agentId;
        string name;
        string modelURI;
        address operator;
        uint256 reputationScore; // Base 10,000 (e.g. 9850 = 98.50%)
        uint256 totalTasks;
        uint256 successfulTasks;
        uint256 registeredAt;
        uint256 lastActiveBlock;
        bool isActive;
    }

    address public immutable owner;
    mapping(bytes32 => Agent) private _agents;
    bytes32[] private _allAgentIds;
    mapping(address => bool) public authorizedCallers;

    event AgentRegistered(
        bytes32 indexed agentId,
        string name,
        string modelURI,
        address indexed operator,
        uint256 timestamp
    );
    event TaskExecuted(
        bytes32 indexed agentId,
        bool success,
        uint256 gasUsed,
        uint256 newReputation
    );
    event PolicyViolationRecorded(
        bytes32 indexed agentId,
        string reason,
        address indexed attemptedTarget,
        bytes4 selector,
        uint256 timestamp
    );
    event AgentStatusChanged(bytes32 indexed agentId, bool isActive);
    event CallerAuthorized(address indexed caller, bool authorized);

    modifier onlyOwner() {
        require(msg.sender == owner, "OperonRegistry: Not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner || authorizedCallers[msg.sender],
            "OperonRegistry: Caller not authorized"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedCallers[msg.sender] = true;
    }

    function setCallerAuthorization(address caller, bool authorized) external onlyOwner {
        authorizedCallers[caller] = authorized;
        emit CallerAuthorized(caller, authorized);
    }

    /**
     * @notice Register an autonomous AI agent under ERC-8004
     */
    function registerAgent(
        string calldata name,
        string calldata modelURI,
        address operator
    ) external returns (bytes32) {
        bytes32 agentId = keccak256(
            abi.encodePacked(name, modelURI, operator, block.timestamp, _allAgentIds.length)
        );
        require(!_agents[agentId].isActive, "OperonRegistry: Agent already exists");

        Agent memory newAgent = Agent({
            agentId: agentId,
            name: name,
            modelURI: modelURI,
            operator: operator,
            reputationScore: 10000, // Starts at 100.00%
            totalTasks: 0,
            successfulTasks: 0,
            registeredAt: block.timestamp,
            lastActiveBlock: block.number,
            isActive: true
        });

        _agents[agentId] = newAgent;
        _allAgentIds.push(agentId);

        emit AgentRegistered(agentId, name, modelURI, operator, block.timestamp);
        return agentId;
    }

    /**
     * @notice Records an execution outcome and dynamically recalibrates reputation score
     */
    function recordTaskOutcome(
        bytes32 agentId,
        bool success,
        uint256 gasUsed
    ) external onlyAuthorized {
        Agent storage agent = _agents[agentId];
        require(agent.isActive, "OperonRegistry: Agent not active");

        agent.totalTasks += 1;
        if (success) {
            agent.successfulTasks += 1;
        }

        // Reputation calculation: Success ratio weighted with activity penalty
        uint256 newReputation = (agent.successfulTasks * 10000) / agent.totalTasks;
        agent.reputationScore = newReputation;
        agent.lastActiveBlock = block.number;

        emit TaskExecuted(agentId, success, gasUsed, newReputation);
    }

    /**
     * @notice Records an onchain policy violation or refusal (Cordon ConductRecord standard)
     * @dev Automatically penalizes reputation score and updates onchain attestation trail.
     */
    function recordViolation(
        bytes32 agentId,
        string calldata reason,
        address attemptedTarget,
        bytes4 selector
    ) external onlyAuthorized {
        Agent storage agent = _agents[agentId];
        require(agent.isActive, "OperonRegistry: Agent not active");

        agent.totalTasks += 1;
        // Penalize reputation score by 200 bps (2%), minimum 0
        if (agent.reputationScore > 200) {
            agent.reputationScore -= 200;
        } else {
            agent.reputationScore = 0;
        }
        agent.lastActiveBlock = block.number;

        emit PolicyViolationRecorded(agentId, reason, attemptedTarget, selector, block.timestamp);
    }

    function setAgentStatus(bytes32 agentId, bool active) external onlyOwner {
        require(_agents[agentId].registeredAt > 0, "OperonRegistry: Agent does not exist");
        _agents[agentId].isActive = active;
        emit AgentStatusChanged(agentId, active);
    }

    function getAgent(bytes32 agentId) external view returns (Agent memory) {
        require(_agents[agentId].registeredAt > 0, "OperonRegistry: Agent does not exist");
        return _agents[agentId];
    }

    function getAllAgentIds() external view returns (bytes32[] memory) {
        return _allAgentIds;
    }

    function totalAgentsCount() external view returns (uint256) {
        return _allAgentIds.length;
    }
}
