// SPDX-License-Identifier: unlicensed
pragma solidity 0.8.10;

address constant BSC_BRIDGEDOGE_ADDRESS = 0x62B8aEB90F3fa3a46607f266e882C4E9cb98F3da;
address constant BSC_DOGE = 0xbA2aE424d960c26247Dd6c32edC70B295c744C43;

interface IBridgeDoge {
    struct BridgeTx { 
        address receiver;
        uint256 amount;
        uint256 timestamp;
    }

    function BSCToDC(address receiver,uint256 amount) external;
    function currentBridgeId() external view returns(uint256);
    function readTransaction(uint256 id) external view returns(BridgeTx memory);
}