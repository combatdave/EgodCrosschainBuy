// SPDX-License-Identifier: unlicensed
pragma solidity 0.8.10;

address constant KIBBLESWAP_ROUTER_ADDRESS = 0x6258c967337D3faF0C2ba3ADAe5656bA95419d5f;

 
interface IKibbleswapRouter {
    function swapExactTokensForETH(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
  external
  payable
  returns (uint[] memory amounts);
}
 