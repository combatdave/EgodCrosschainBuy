task("rescuewdoge", "A sample task with params")
    .setAction(async(taskArgs) => {
        const contractName = "EgodXCReciever";
        const amount = ethers.utils.parseEther("54.6");

        const tokenInst = await ethers.getContractAt(contractName, (await deployments.get(contractName)).address);

        let tx = await tokenInst.rescueWdoge();

        console.log("tx hash: ", tx.hash);
    });