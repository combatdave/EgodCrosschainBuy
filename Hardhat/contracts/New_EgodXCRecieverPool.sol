// SPDX-License-Identifier: unlicensed
pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "./DogeSwap.sol";

address constant WDOGE = 0xB7ddC6414bf4F5515b52D8BdD69973Ae205ff101;
address constant EGOD = 0xBfbb7B1d22FF521a541170cAFE0C9A7F20d09c3B;

contract EgodXCRecieverPool is Ownable {

    mapping(bytes32 => bool) public proccessedTransactions;
    address public oracle;
    IDogeswapRouter public dogeswap;
    IERC20 public egod;

    receive() external payable {}
    fallback() external payable {}

    constructor() {
        oracle = msg.sender;
        dogeswap = IDogeswapRouter(DOGESWAP_ROUTER_ADDRESS);
        egod = IERC20(EGOD);
    }

    function setOracleAddress(address newOracle) public onlyOwner {
        oracle = newOracle;
    }

    modifier onlyOracle() {
        require(msg.sender == oracle, "Only oracle can call this function.");
        _;
    }

    event buyComplete(bytes32 indexed txHash, uint indexed amountWDOGE, address indexed reciever, uint amountSAVIOR);

    function processBuy(bytes32 txHash, uint amountWDOGE, address reciever) public onlyOracle {
        require(address(this).balance >= amountWDOGE, "Not enough balance in contract");
        require(!proccessedTransactions[txHash], "Transaction already proccessed");
        proccessedTransactions[txHash] = true;

        address[] memory wdoge_to_egod = new address[](2);
        wdoge_to_egod[0] = WDOGE;
        wdoge_to_egod[1] = address(egod);

        uint saviorBefore = egod.balanceOf(reciever);
        dogeswap.swapExactWDOGEForTokensSupportingFeeOnTransferTokens{value:amountWDOGE}(
            0,
            wdoge_to_egod,
            reciever,
            block.timestamp
        );
        uint saviorAfter = egod.balanceOf(reciever);
        uint saviourBought = saviorAfter - saviorBefore;

        emit buyComplete(txHash, amountWDOGE, reciever, saviourBought);
    }

    function isProcessed(bytes32 txHash) public view returns (bool processed) {
        return proccessedTransactions[txHash];
    }

    function withdrawToken(address token) public onlyOwner {
        IERC20(token).transfer(msg.sender, IERC20(token).balanceOf(address(this)));
    }

    function withdrawWdoge() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }
}