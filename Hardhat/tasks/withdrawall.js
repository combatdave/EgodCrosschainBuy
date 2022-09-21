task("withdrawall", "A sample task with params")
    .setAction(async(taskArgs) => {
        const contractName = "EgodXCSender";
        const address = (await deployments.get(contractName)).address;
        const contractInst = await ethers.getContractAt(contractName, address);
        let tx1 = await contractInst.rescueBnb();
        let tx2 = await contractInst.withdrawDoge();

        console.log("tx hash: ", tx.hash);
        console.log("tx hash: ", tx2.hash);
    });