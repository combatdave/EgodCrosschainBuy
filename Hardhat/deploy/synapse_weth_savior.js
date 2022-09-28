module.exports = async({ getNamedAccounts, deployments, getChainId }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    let chainId = await getChainId();

    if (chainId != 2000 && chainId != 31337) {
        console.log("Not on Dogechain or localhost:", chainId);
        return;
    }

    const recieverContractName = "TransmuterReciever_WETH_SAVIOR";

    let deployment = await deploy(recieverContractName, {
        from: deployer,
        log: true,
    });

    console.log("Deployed", recieverContractName, "to", deployment.address);
};
module.exports.tags = ['Transmuter_Synapse_WETH_SAVIOR'];