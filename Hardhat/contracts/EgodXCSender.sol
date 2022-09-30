// SPDX-License-Identifier: unlicensed
pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "./PancakeSwap.sol";
import "./IBridgeDoge.sol";
import "./ISynapseBridge.sol";


address constant WBNB_ADDR = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
address constant BUSD_ADDR = 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56;

contract EgodXCSender is Ownable {

    uint public minimumBuy = 0.1 ether;
    bool public enabled = true;
    IBridgeDoge public bridgeDoge;
    IPancakeRouter02 public pancakeswap;
    IERC20 public doge;

    address public dogechainRecieverAddress_doge;
    address public dogechainRecieverAddress_BUSD;

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

    function setReciever_Doge(address _recieverAddress) public onlyOwner {
        dogechainRecieverAddress_doge = _recieverAddress;
    }

    function setReciever_BUSD(address _recieverAddress) public onlyOwner {
        dogechainRecieverAddress_BUSD = _recieverAddress;
    }


    function setAllEnabled(bool newEnabled) public onlyOwner {
        enabled = newEnabled;
    }

    // ***************** BRIDGEDOGE *****************

    function transmute_BridgeDoge(address DCTokenAddress) public payable {
        require(enabled, "EgodXCSender: Disabled");
        require(msg.value >= minimumBuy, "EgodXCSender: Minimum buy not met.");
        bridgeOut_BridgeDoge(DCTokenAddress);
    }

    event egodCrossChainBuy_BridgeDoge(address indexed buyer, address indexed DCTokenAddress, uint indexed bridgeId, uint256 amountDoge);
    function bridgeOut_BridgeDoge(address DCTokenAddress) internal {
        address[] memory bnb_to_doge = new address[](2);
        bnb_to_doge[0] = WBNB_ADDR;
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

        uint bridgeId = bridgeDoge.currentBridgeId(); // The correct bridge ID is the one before bc ???
        bridgeDoge.BSCToDC(dogechainRecieverAddress_doge, amountToSend);
        IBridgeDoge.BridgeTx memory bridgeTx = bridgeDoge.readTransaction(bridgeId);
        
        emit egodCrossChainBuy_BridgeDoge(msg.sender, DCTokenAddress, bridgeId, bridgeTx.amount);
    }

    // ***************** SYNAPSE *****************

    function transmute_Synapse(address DCTokenAddress) public payable {
        require(enabled, "EgodXCSender: Disabled");
        require(msg.value >= minimumBuy, "EgodXCSender: Minimum buy not met.");
        bridgeOut_Synapse(DCTokenAddress);
    }

    event egodCrossChainBuy_Synapse_BUSD(address indexed buyer, address indexed DCTokenAddress, uint256 amountBUSD);
    function bridgeOut_Synapse(address DCTokenAddress) internal {
        address[] memory bnb_to_busd = new address[](2);
        bnb_to_busd[0] = WBNB_ADDR;
        bnb_to_busd[1] = BUSD_ADDR;

        IERC20 busd = IERC20(BUSD_ADDR);
        uint balance_before = busd.balanceOf(address(this));
        pancakeswap.swapExactETHForTokens{value:msg.value}(
            0,
            bnb_to_busd,
            address(this),
            block.timestamp + 1
        );
        uint balance_after = busd.balanceOf(address(this));
        uint amountBUSD = balance_after - balance_before;

        ISynapseBridge bridge = ISynapseBridge(BSC_SYNAPSE_ADDRESS);
        busd.approve(BSC_SYNAPSE_ADDRESS, amountBUSD);
        bridge.deposit(dogechainRecieverAddress_BUSD, 2000, busd, amountBUSD);
        emit egodCrossChainBuy_Synapse_BUSD(msg.sender, DCTokenAddress, amountBUSD);
    }

    // ***************** PANIC *****************

    function rescueToken(IERC20 token) public onlyOwner {
        token.transfer(msg.sender, token.balanceOf(address(this)));
    }

    function rescueBnb() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }
}