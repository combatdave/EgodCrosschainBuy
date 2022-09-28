// SPDX-License-Identifier: unlicensed
pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "./PancakeSwap.sol";
import "./IBridgeDoge.sol";
import "./ISynapseBridge.sol";


address constant BNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;

contract EgodXCSender is Ownable {

    uint public minimumBuy = 0.1 ether;
    bool public enabled = true;
    IBridgeDoge public bridgeDoge;
    IPancakeRouter02 public pancakeswap;
    IERC20 public doge;

    address public dogechainRecieverAddress;

    receive() external payable {}
    fallback() external payable {}

    constructor() {
        pancakeswap = IPancakeRouter02(PANCAKESWAP_ROUTER_ADDRESS);
        doge = IERC20(BSC_DOGE);
        bridgeDoge = IBridgeDoge(BSC_BRIDGEDOGE_ADDRESS);
        doge.approve(BSC_BRIDGEDOGE_ADDRESS, type(uint256).max);
    }

    function setMinimumBuy(uint256 newMinimumBuy) public onlyOwner {
        minimumBuy = newMinimumBuy;
    }

    function setReciever(address _recieverAddress) public onlyOwner {
        dogechainRecieverAddress = _recieverAddress;
    }

    function setAllEnabled(bool newEnabled) public onlyOwner {
        enabled = newEnabled;
    }

    function doOneClickBuy(address DCTokenAddress) public payable {
        require(enabled, "EgodXCSender: Disabled");
        require(msg.value >= minimumBuy, "EgodXCSender: Minimum buy not met.");

        address[] memory bnb_to_doge = new address[](2);
        bnb_to_doge[0] = BNB;
        bnb_to_doge[1] = BSC_DOGE;

        uint balance_before = doge.balanceOf(address(this));
        pancakeswap.swapExactETHForTokens{value:msg.value}(
            0,
            bnb_to_doge,
            address(this),
            block.timestamp + 1
        );
        uint balance_after = doge.balanceOf(address(this));
        uint amountToSend = balance_after - balance_before;

        bridgeOut_BridgeDoge(DCTokenAddress, amountToSend);
    }

    event egodCrossChainBuy_BridgeDoge(address indexed buyer, address indexed DCTokenAddress, uint indexed bridgeId, uint256 amountDoge);
    function bridgeOut_BridgeDoge(address DCTokenAddress, uint256 amountToSend) internal {
        uint bridgeId = bridgeDoge.currentBridgeId(); // The correct bridge ID is the one before bc ???
        bridgeDoge.BSCToDC(dogechainRecieverAddress, amountToSend);
        IBridgeDoge.BridgeTx memory bridgeTx = bridgeDoge.readTransaction(bridgeId);
        
        emit egodCrossChainBuy_BridgeDoge(msg.sender, DCTokenAddress, bridgeId, bridgeTx.amount);
    }

    function withdrawDoge() public onlyOwner {
        doge.transfer(msg.sender, doge.balanceOf(address(this)));
    }

    function rescue(address token, uint amount) public onlyOwner {
        IERC20(token).transfer(msg.sender, amount);
    }

    function rescueBnb() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }
}