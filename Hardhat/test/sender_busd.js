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
            const SAVIOR_ADDR = "0xBfbb7B1d22FF521a541170cAFE0C9A7F20d09c3B";
            let tx = await senderInst.transmute_Synapse(SAVIOR_ADDR, { value: ethers.utils.parseEther("0.1") });
            let rx = await tx.wait();

            const event = rx.events.filter((e) => e.event == "egodCrossChainBuy_Synapse_BUSD")[0];

            expect(event).to.exist;
        });
    });
});