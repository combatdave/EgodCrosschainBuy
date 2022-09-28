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

    const dogechainRecieverDeployment = require("../deployments/dogechain/EgodXCReciever.json");
    let addRecieverTx = await sender.setReciever(dogechainRecieverDeployment.address);

    console.log("Added reciever for Dogechain Egod token:", addRecieverTx.hash);
};
module.exports.tags = ['EgodXCSender'];