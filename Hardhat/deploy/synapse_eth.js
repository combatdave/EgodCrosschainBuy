module.exports = async({ getNamedAccounts, deployments, getChainId }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    let chainId = await getChainId();

    if (chainId != 1 && chainId != 31337) {
        console.log("Not on ETH or localhost:", chainId);
        return;
    }

    const senderContractName = "TransmuterSender_Synapse_WETH";
    const recieverContractName = "TransmuterReciever_WETH_SAVIOR";

    let deployment = await deploy(senderContractName, {
        from: deployer,
        log: true,
    });

    console.log("Deployed", senderContractName, "to", deployment.address);

    let senderContract = await ethers.getContractAt(senderContractName, deployment.address);

    let recieverDeployment = undefined;
    try {
        recieverDeployment = require("../deployments/dogechain/" + recieverContractName + ".json");
    } catch (e) {
        console.log("No reciever deployment for WETH found on dogechain");
        return;
    }

    if (recieverDeployment) {
        let addRecieverTx = await senderContract.setDogechainRecieverAddress(recieverDeployment.address);
        console.log(TransmuterSender_Synapse_BUSD, "reciever set to", recieverDeployment.address, ":", addRecieverTx.hash);
    }
};
module.exports.tags = ['Transmuter_Synapse_ETH'];