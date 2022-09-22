// SPDX-License-Identifier: unlicensed
pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "hardhat/console.sol";
import "../DogeSwap.sol";
import "./TransmuterReciever_Base.sol";
import "../Yodeswap.sol";

IERC20 constant BUSD = IERC20(0x332730a4F6E03D9C55829435f10360E13cfA41Ff);
IERC20 constant WDOGE = IERC20(0xB7ddC6414bf4F5515b52D8BdD69973Ae205ff101);
IERC20 constant SAVIOR = IERC20(0xBfbb7B1d22FF521a541170cAFE0C9A7F20d09c3B);

contract TransmuterReciever_BUSD_SAVIOR is TransmuterReciever_Base {
    function processBuy(bytes32 txHash, uint amountToken, address reciever) public override onlyOracle {
        require(!proccessedTransactions[txHash], "Transaction already proccessed");
        proccessedTransactions[txHash] = true;

        uint amountWDOGE = swapBUSDforWDOGE(amountToken);
        uint amountSAVIOR = swapWDOGEforSAVIOR(amountWDOGE, reciever);

        emit buyComplete(txHash, amountWDOGE, reciever, amountSAVIOR);
    }

    function swapBUSDforWDOGE(uint amountBUSD) internal returns (uint256 amountWDOGE) {
        IYodeswapRouter router = IYodeswapRouter(YODESWAP_ROUTER_ADDRESS);
        address[] memory path = new address[](2);
        path[0] = address(BUSD);
        path[1] = address(WDOGE);

        uint balance_before = WDOGE.balanceOf(address(this));

        BUSD.approve(address(router), amountBUSD);
        router.swapExactTokensForETH(
            amountBUSD,
            0,
            path,
            address(this),
            block.timestamp
        );

        uint balance_after = WDOGE.balanceOf(address(this));

        amountWDOGE = balance_after - balance_before;
        return amountWDOGE;
    }

    function swapWDOGEforSAVIOR(uint amountWDOGE, address to) internal returns (uint256 amountSAVIOR) {
        IDogeswapRouter dogeswap = IDogeswapRouter(DOGESWAP_ROUTER_ADDRESS);

        address[] memory path = new address[](2);
        path[0] = address(WDOGE);
        path[1] = address(SAVIOR);

        uint balance_before = SAVIOR.balanceOf(to);

        WDOGE.approve(address(dogeswap), amountWDOGE);
        dogeswap.swapExactWDOGEForTokensSupportingFeeOnTransferTokens{value:amountWDOGE}(
            0,
            path,
            to,
            block.timestamp
        );

        uint balance_after = SAVIOR.balanceOf(to);

        amountSAVIOR = balance_after - balance_before;
        return amountSAVIOR;
    }
}