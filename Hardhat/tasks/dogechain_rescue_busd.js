task("dogechain_rescue_busd", "A sample task with params")
    .setAction(async(taskArgs) => {
        const contractName = "EgodXCReciever_BUSD";
        const address = (await deployments.get(contractName)).address;
        const contractInst = await ethers.getContractAt(contractName, address);
        let tx = await contractInst.rescue("0x1555c68be3b22cdcca934ae88cb929db40ab311d", "27536952959350390542");

        console.log("tx hash: ", tx.hash);
    });