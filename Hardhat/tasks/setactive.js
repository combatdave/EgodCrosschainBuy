task("setactive", "A sample task with params")
    .setAction(async(taskArgs) => {
        const contractName = "EgodXCSender";

        const contractInst = await ethers.getContractAt(contractName, (await deployments.get(contractName)).address);

        let tx = await contractInst.setAllEnabled(false);

        console.log(tx);
    });