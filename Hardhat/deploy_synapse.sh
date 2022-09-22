#!/bin/bash
npx hardhat compile

npx hardhat --network dogechain deploy --tags Transmuter_Synapse_Dogechain && npx hardhat --network bsc deploy --tags Transmuter_Synapse_BSC
echo Deployment finished
echo

cp deployments/bsc/TransmuterSender_Synapse_BUSD.json ../Server/src/deployments/bsc/TransmuterSender_Synapse_BUSD.json
echo Copied TransmuterSender_Synapse_BUSD deployment from Hardhat to Server

cp deployments/dogechain/TransmuterReciever_BUSD_SAVIOR.json ../Server/src/deployments/dogechain/TransmuterReciever_BUSD_SAVIOR.json
echo Copied TransmuterReciever_BUSD_SAVIOR deployment from Hardhat to Server

echo
echo FINISHED!