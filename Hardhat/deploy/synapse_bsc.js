module.exports = async({ getNamedAccounts, deployments, getChainId }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    let chainId = await getChainId();

    if (chainId != 56 && chainId != 31337) {
        console.log("Not on BSC or localhost:", chainId);
        return;
    }

    const senderContractName = "TransmuterSender_Synapse_BUSD";
    const recieverContractName = "TransmuterReciever_BUSD_SAVIOR";

    let deployment = await deploy(senderContractName, {
        from: deployer,
        log: true,
    });

    console.log("Deployed", senderContractName, "to", deployment.address);

    let senderContract = await ethers.getContractAt(senderContractName, deployment.address);

    const recieverDeployment = require("../deployments/dogechain/" + recieverContractName + ".json");
    let addRecieverTx = await senderContract.setDogechainRecieverAddress(recieverDeployment.address);

    console.log(TransmuterSender_Synapse_BUSD, "reciever set to", recieverDeployment.address, ":", addRecieverTx.hash);
};
module.exports.tags = ['Transmuter_Synapse_BSC'];