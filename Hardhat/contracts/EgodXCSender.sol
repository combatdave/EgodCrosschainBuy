// SPDX-License-Identifier: unlicensed
pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "./PancakeSwap.sol";
import "./IBridgeDoge.sol";

struct DCRecieverData {
    address recieverAddress;
    bool enabled;
}

address constant BNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
address constant anyDOGE = 0x57F3FEe2cfa3769fD25E3774Eb514FACe7C70BEb;

contract EgodXCSender is Ownable {

    uint public minimumBuy = 0.1 ether;
    bool public allEnabled = true;
    IBridgeDoge public bridgeDoge;
    IPancakeRouter02 public pancakeswap;
    IERC20 public doge;

    mapping(address => DCRecieverData) public recieversByDCTokenAddress;
    address[] public recievers;
    mapping(address => uint256) public feeByDCTokenAddressBase1000;
    bool public feeEnabled;

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

    function setRecieverForDCTokenAddress(address DCTokenAddress, address recieverAddress, bool enabled) public onlyOwner {
        recieversByDCTokenAddress[DCTokenAddress] = DCRecieverData(recieverAddress, enabled);
        recievers.push(recieverAddress);
    }

    function setRecieverEnabled(address DCTokenAddress, bool enabled) public onlyOwner {
        recieversByDCTokenAddress[DCTokenAddress].enabled = enabled;
    }

    function setAllEnabled(bool enabled) public onlyOwner {
        allEnabled = enabled;
    }

    function getRecieverForDCTokenAddress(address DCTokenAddress) public view returns (address) {
        return recieversByDCTokenAddress[DCTokenAddress].recieverAddress;
    }

    function getRecievers() public view returns (address[] memory) {
        return recievers;
    }

    function setFeeEnabled(bool newFeeEnabled) public onlyOwner {
        feeEnabled = newFeeEnabled;
    }

    function setFeeForDCTokenAddress(address DCTokenAddress, uint256 feeBase1000) public onlyOwner {
        feeByDCTokenAddressBase1000[DCTokenAddress] = feeBase1000;
    }

    function doOneClickBuy(address DCTokenAddress) public payable {
        require(allEnabled, "EgodXCSender: Disabled");
        require(recieversByDCTokenAddress[DCTokenAddress].enabled, "EgodXCSender: No reciever.");
        require(msg.value >= minimumBuy, "EgodXCSender: Minimum buy not met.");

        address[] memory bnb_to_doge = new address[](2);
        bnb_to_doge[0] = BNB;
        bnb_to_doge[1] = BSC_DOGE;

        uint256 bnbPostFee = msg.value;
        if (feeEnabled) {
            bnbPostFee = bnbPostFee * (1000 - feeByDCTokenAddressBase1000[DCTokenAddress]) / 1000;
        }

        uint balance_before = doge.balanceOf(address(this));
        pancakeswap.swapExactETHForTokens{value:bnbPostFee}(
            0,
            bnb_to_doge,
            address(this),
            block.timestamp
        );
        uint balance_after = doge.balanceOf(address(this));
        uint amountToSend = balance_after - balance_before;

        if (useSelfBridge) {
            bridgeOut_Self(DCTokenAddress, amountToSend);
        } else {
            bridgeOut_BridgeDoge(DCTokenAddress, amountToSend);
        }
    }

    bool public useSelfBridge = false;
    function setUseSelfBridge(bool newUseSelfBridge) public onlyOwner {
        useSelfBridge = newUseSelfBridge;
    }

    uint public selfFeePercent = 2;
    function setSelfFeePercent(uint newSelfFeePercent) public onlyOwner {
        selfFeePercent = newSelfFeePercent;
    }

    event takenFee(address indexed sender, uint256 amount);
    event egodCrossChainBuy_Self(address indexed buyer, address indexed DCTokenAddress, uint256 amountDoge);
    function bridgeOut_Self(address DCTokenAddress, uint256 amountToSend) internal {
        uint fee = amountToSend * selfFeePercent / 100;
        uint amountOut = amountToSend - fee;
        emit takenFee(msg.sender, fee);
        emit egodCrossChainBuy_Self(msg.sender, DCTokenAddress, amountOut);
    }

    event egodCrossChainBuy_BridgeDoge(address indexed buyer, address indexed DCTokenAddress, uint indexed bridgeId, uint256 amountDoge);
    function bridgeOut_BridgeDoge(address DCTokenAddress, uint256 amountToSend) internal {
        address dogechainRecieverAddress = recieversByDCTokenAddress[DCTokenAddress].recieverAddress;

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