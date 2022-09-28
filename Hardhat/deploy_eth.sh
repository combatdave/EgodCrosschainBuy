#!/bin/bash
npx hardhat compile

# npx hardhat --network dogechain deploy --tags TransmuterReciever_WETH_SAVIOR
# echo Dogechain eployment complete
# cp deployments/dogechain/TransmuterReciever_WETH_SAVIOR.json ../Server/src/deployments/dogechain/TransmuterReciever_WETH_SAVIOR.json
# echo Copied TransmuterReciever_WETH_SAVIOR deployment from Hardhat to Server

npx hardhat --network ethereum deploy --tags Transmuter_Synapse_ETH
echo Ethereum eployment complete
cp deployments/ethereum/TransmuterSender_Synapse_WETH.json ../Server/src/deployments/ethereum/TransmuterSender_Synapse_WETH.json
echo Copied TransmuterSender_Synapse_WETH deployment from Hardhat to Server

echo
echo FINISHED!