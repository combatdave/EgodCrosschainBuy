// SPDX-License-Identifier: unlicensed
pragma solidity 0.8.10;

address constant DOGESWAP_ROUTER_ADDRESS = 0xa4EE06Ce40cb7e8c04E127c1F7D3dFB7F7039C81;

interface IDogeswapFactory {
    function createPair(address tokenA, address tokenB) external returns (address pair);
}
 
interface IDogeswapRouter {
    function factory() external pure returns (address);
    function WWDOGE() external pure returns (address);
 
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);
 
    function addLiquidityWDOGE(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountWDOGEMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountWDOGE, uint liquidity);

    function removeLiquidityWDOGE(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external returns (uint amountToken, uint amountWDOGE);
 
    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
 
    function swapExactWDOGEForTokensSupportingFeeOnTransferTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable;
 
    function swapExactTokensForWDOGESupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;

    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);
}
 