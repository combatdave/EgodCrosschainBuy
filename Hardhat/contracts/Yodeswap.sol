// SPDX-License-Identifier: unlicensed
pragma solidity 0.8.10;

address constant YODESWAP_ROUTER_ADDRESS = 0x72d85Ab47fBfc5E7E04a8bcfCa1601D8f8cE1a50;

 
interface IYodeswapRouter {
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
 