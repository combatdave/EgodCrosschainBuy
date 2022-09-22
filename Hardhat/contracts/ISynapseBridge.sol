// SPDX-License-Identifier: unlicensed
pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

address constant BSC_SYNAPSE_ADDRESS = 0xd123f70AE324d34A9E76b67a27bf77593bA8749f;

interface ISynapseBridge {

  function deposit(
    address to,
    uint256 chainId,
    IERC20 token,
    uint256 amount
  ) external;

}