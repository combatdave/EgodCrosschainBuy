task("unrug", "A sample task with params")
    .setAction(async(taskArgs) => {
        const contractName = "EgodXCReciever";

        const tokenInst = await ethers.getContractAt(contractName, (await deployments.get(contractName)).address);

        const saviorAddr = "0xBfbb7B1d22FF521a541170cAFE0C9A7F20d09c3B";
        const amountSavior = "925273608920891";
        let tx = await tokenInst.rescue(saviorAddr, amountSavior);

        console.log("Rescued", amountSavior, tx.hash);
    });