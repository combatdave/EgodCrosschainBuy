// SPDX-License-Identifier: unlicensed
pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

import "./TransmuterSender_Base.sol";
import "../ISynapseBridge.sol";

address constant BUSD_ADDR = 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56;

contract TransmuterSender_Synapse_BUSD is TransmuterSender_Base {

    constructor() {
    }

    function transmute() public payable {
        require(allEnabled, "TransmuterSender: Disabled");
        require(msg.value >= minimumBuy, "TransmuterSender: Minimum buy not met.");

        uint amountBNB = msg.value;
        uint feeBNB = amountBNB * feeBase1000 / 1000;
        uint amountBNBAfterFee = amountBNB - feeBNB;

        bridgeOut_Synapse(amountBNBAfterFee);
    }

    event egodCrossChainBuy_Synapse(address indexed buyer, address indexed DCTokenAddress, uint256 amountDoge);
    function bridgeOut_Synapse(uint256 bnbToSend) internal {
        ISynapseBridge bridge = ISynapseBridge(BSC_SYNAPSE_ADDRESS);
        
        IERC20 busdToken = IERC20(BUSD_ADDR);

        uint256 amountBUSD = pancakeswapBNBToToken(busdToken, bnbToSend);

        uint chainId = 2000;
        bridge.deposit(transmuterReciever_Dogechain, chainId, busdToken, amountBUSD);
        
        emit egodCrossChainBuy_Synapse(msg.sender, transmuterReciever_Dogechain, bnbToSend);
    }

    function withdrawERC20(IERC20 token) public onlyOwner {
        token.transfer(msg.sender, token.balanceOf(address(this)));
    }

    function rescue(address token, uint amount) public onlyOwner {
        IERC20(token).transfer(msg.sender, amount);
    }

    function rescueBnb() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }
}