module.exports = async({ getNamedAccounts, deployments, getChainId }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    let chainId = await getChainId();

    if (chainId != 2000 && chainId != 31337) {
        console.log("Not on Dogechain or localhost:", chainId);
        return;
    }

    let deployment = await deploy('EgodXCReciever_BUSD', {
        from: deployer,
        log: true,
    });

    console.log("Deployed EgodXCReciever_BUSD to", deployment.address);
};
module.exports.tags = ['EgodXCReciever_BUSD'];