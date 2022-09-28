// SPDX-License-Identifier: unlicensed
pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";
import "./TransmuterSender_Base.sol";
import "../ISynapseBridge.sol";

uint constant DOGECHAIN_CHAIN_ID = 2000;

contract TransmuterSender_Synapse_WETH is TransmuterSender_Base {

    constructor() {
        minimumBuy = 0.01 ether;
    }

    function transmute() public payable {
        require(allEnabled, "TransmuterSender: Disabled");
        require(msg.value >= minimumBuy, "TransmuterSender: Minimum buy not met.");

        uint amountETH = msg.value;
        uint feeETH = amountETH * feeBase1000 / 1000;
        uint amountETHAfterFee = amountETH - feeETH;

        bridgeOut_Synapse(amountETHAfterFee);
    }

    event egodCrossChainBuy_Synapse_WETH(address indexed buyer, address indexed DCTokenAddress, uint256 amountWETH);
    function bridgeOut_Synapse(uint256 ethToSend) internal {
        ISynapseBridge bridge = ISynapseBridge(ETH_SYNAPSE_ADDRESS);
        bridge.depositETH{value: ethToSend}(transmuterReciever_Dogechain, DOGECHAIN_CHAIN_ID, ethToSend);
        emit egodCrossChainBuy_Synapse_WETH(msg.sender, transmuterReciever_Dogechain, ethToSend);
    }

    function rescueERC20(IERC20 token) public onlyOwner {
        token.transfer(msg.sender, token.balanceOf(address(this)));
    }

    function rescueETH() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }
}