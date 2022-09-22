// SPDX-License-Identifier: unlicensed
pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../PancakeSwap.sol";
import "hardhat/console.sol";

address constant BNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;

contract TransmuterSender_Base is Ownable {
    uint public minimumBuy = 0.1 ether;
    bool public allEnabled = true;

    address public transmuterReciever_Dogechain;
    bool public senderEnabled = true;
    uint public feeBase1000 = 0;

    receive() external payable {}
    fallback() external payable {}

    constructor() {
    }

    function setDogechainRecieverAddress(address dogechainRecieverAddress) public onlyOwner {
        transmuterReciever_Dogechain = dogechainRecieverAddress;
    }

    function setMinimumBuy(uint256 newMinimumBuy) public onlyOwner {
        minimumBuy = newMinimumBuy;
    }

    function setEnabled(bool enabled) public onlyOwner {
        senderEnabled = enabled;
    }

    function setFeeBase1000(uint newFeeBase1000) public onlyOwner {
        feeBase1000 = newFeeBase1000;
    }

    function pancakeswapBNBToToken(IERC20 token, uint amountBNB) internal returns (uint256 amountToken) {
        IPancakeRouter02 pancakeswap = IPancakeRouter02(PANCAKESWAP_ROUTER_ADDRESS);

        address[] memory bnb_to_doge = new address[](2);
        bnb_to_doge[0] = BNB;
        bnb_to_doge[1] = address(token);

        uint balance_before = token.balanceOf(address(this));
        pancakeswap.swapExactETHForTokens{value:amountBNB}(
            0,
            bnb_to_doge,
            address(this),
            block.timestamp
        );
        uint balance_after = token.balanceOf(address(this));
        amountToken = balance_after - balance_before;
        return amountToken;
    }
}