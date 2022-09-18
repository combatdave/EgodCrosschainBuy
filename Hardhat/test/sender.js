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

        await deployments.fixture(["EgodXCSender"]);
        senderInst = await ethers.getContractAt("EgodXCSender", (await deployments.get('EgodXCSender')).address);
    });

    describe("Processing a tx", function() {
        it("Sends BNB", async function() {
            await senderInst.doOneClickBuy({ value: ethers.utils.parseEther("0.1") });
        });
    });
});