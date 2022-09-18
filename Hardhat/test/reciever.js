// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");
const hre = require("hardhat");

describe("Egod Crosschain Buy Reciever", function() {

    let recieverInst;
    let egodInst;

    let owner;
    let addr1;
    let addr2;
    let addrs;

    before(async function() {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        await deployments.fixture(["EgodXCReciever"]);
        recieverInst = await ethers.getContractAt("EgodXCReciever", (await deployments.get('EgodXCReciever')).address);

        egodInst = await ethers.getContractAt("IERC20", "0xBfbb7B1d22FF521a541170cAFE0C9A7F20d09c3B");
    });

    describe("Processing a tx", function() {
        it("Gets some BUSD", async function() {
            const yodeswap = await ethers.getContractAt("IYodeswapRouter", "0x72d85ab47fbfc5e7e04a8bcfca1601d8f8ce1a50");
            const busd = await ethers.getContractAt("IERC20", "0x332730a4F6E03D9C55829435f10360E13cfA41Ff");
            const usdc_addr = "0x765277eebeca2e31912c9946eae1021199b39c61";
            const wdoge = await ethers.getContractAt("IERC20", "0xB7ddC6414bf4F5515b52D8BdD69973Ae205ff101");

            const wdoge_to_busd = [
                "0xB7ddC6414bf4F5515b52D8BdD69973Ae205ff101",
                "0x765277eebeca2e31912c9946eae1021199b39c61",
                "0x332730a4F6E03D9C55829435f10360E13cfA41Ff"
            ];

            let balance_before = await ethers.provider.getBalance(owner.address);

            let tx = await yodeswap.swapExactETHForTokens(
                0, wdoge_to_busd,
                owner.address,
                ethers.constants.MaxUint256, {
                    value: ethers.utils.parseEther("100"),
                }
            );

            await tx.wait();

            let balance_after = await ethers.provider.getBalance(owner.address);

            expect(balance_after).to.be.lt(balance_before);
        });

        it("Moves BUSD to the reciever", async function() {
            const busd = await ethers.getContractAt("IERC20", "0x332730a4F6E03D9C55829435f10360E13cfA41Ff");
            let tx = await busd.transfer(recieverInst.address, ethers.utils.parseEther("2"));
            await tx.wait();

            let balance = await busd.balanceOf(recieverInst.address);
        });

        it("Does a thing", async function() {
            const savior_before = await egodInst.balanceOf(addr1.address);

            let tx = await recieverInst.processBuy("0x332730a4F6E03D9C55829435f10360E13cfA41Ff", ethers.utils.parseEther("2"), addr1.address);
            await tx.wait();

            const savior_after = await egodInst.balanceOf(addr1.address);

            expect(savior_after).to.be.gt(savior_before);
        });
    });
});