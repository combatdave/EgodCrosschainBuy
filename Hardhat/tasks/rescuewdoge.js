task("rescuewdoge", "A sample task with params")
    .setAction(async(taskArgs) => {
        const contractName = "EgodXCReciever";
        const address = (await deployments.get(contractName)).address;
        const contractInst = await ethers.getContractAt(contractName, address);
        let tx = await contractInst.rescueWdoge();

        console.log("tx hash: ", tx.hash);
    });