// SPDX-License-Identifier: unlicensed
pragma solidity 0.8.10;

address constant BSC_BRIDGEDOGE_ADDRESS = 0xF2D3F911Fd3377dC979FDb3060D9C79Da99592c4;
address constant BSC_DOGE = 0xbA2aE424d960c26247Dd6c32edC70B295c744C43;

interface IBridgeDoge {
    function BSCToDC (address receiver,uint256 amount) external;
}