// SPDX-License-Identifier: unlicensed
pragma solidity 0.8.10;

address constant BSC_MULTICHAIN_ROUTER_ADDRESS = 0xf9736ec3926703e85C843FC972BD89A7f8E827C0;

interface IMultichainRouter {
    function anySwapOutUnderlying(address token, address to, uint amount, uint toChainID) external;
}