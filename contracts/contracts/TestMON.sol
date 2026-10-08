// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title TestMON
 * @notice Self-minting ERC20 test token for zero-mock liquidity testing on Monad.
 */
contract TestMON is ERC20 {
    constructor() ERC20("Operon Monad Test Token", "tMON") {
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
