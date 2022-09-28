// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");
const hre = require("hardhat");

describe("Egod Crosschain Sender", function() {

    let senderInst;

    let owner;
    let addr1;
    let addr2;
    let addrs;

    before(async function() {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        await deployments.fixture(["Transmuter_Synapse_ETH"]);
        senderInst = await ethers.getContractAt("TransmuterSender_Synapse_WETH", (await deployments.get('TransmuterSender_Synapse_WETH')).address);
    });

    describe("Processing a tx", function() {
        it("Sends ETH", async function() {
            await senderInst.transmute({ value: ethers.utils.parseEther("0.01") });
        });
    });
});