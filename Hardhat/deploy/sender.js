module.exports = async({ getNamedAccounts, deployments, getChainId }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    let chainId = await getChainId();

    if (chainId != 56 && chainId != 31337) {
        console.log("Not on BSC or localhost:", chainId);
        return;
    }

    let deployment = await deploy('EgodXCSender', {
        from: deployer,
        log: true,
    });

    console.log("Deployed EgodXCSender to", deployment.address);

    let sender = await ethers.getContractAt('EgodXCSender', deployment.address);

    try {
        const deployment_reciever_doge = require("../deployments/dogechain/EgodXCReciever_Doge.json");
        await sender.setReciever_Doge(deployment_reciever_doge.address);
    } catch {
        console.error("No reciever for DOGE");
    }

    try {
        const deployment_reciever_BUSD = require("../deployments/dogechain/EgodXCReciever_BUSD.json");
        await sender.setReciever_BUSD(deployment_reciever_BUSD.address);
    } catch {
        console.error("No reciever for BUSD");
    }
};
module.exports.tags = ['EgodXCSender'];