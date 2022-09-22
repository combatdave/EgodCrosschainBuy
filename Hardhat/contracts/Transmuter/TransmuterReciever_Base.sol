// SPDX-License-Identifier: unlicensed
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract TransmuterReciever_Base is Ownable {
    mapping(bytes32 => bool) public proccessedTransactions;
    address public oracle;

    receive() external payable {}
    fallback() external payable {}

    constructor() {
        oracle = msg.sender;
    }

    function setOracleAddress(address newOracle) public onlyOwner {
        oracle = newOracle;
    }

    modifier onlyOracle() {
        require(msg.sender == oracle, "Only oracle can call this function.");
        _;
    }

    event buyComplete(bytes32 indexed txHash, uint indexed amountWDOGE, address indexed reciever, uint amountSAVIOR);
    function processBuy(bytes32 txHash, uint amountToken, address reciever) virtual public ;

    function isProcessed(bytes32 txHash) public view returns (bool processed) {
        return proccessedTransactions[txHash];
    }

    function rescueIERC20(IERC20 token) public onlyOwner {
        token.transfer(msg.sender, token.balanceOf(address(this)));
    }

    function rescueWDOGE() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }
}