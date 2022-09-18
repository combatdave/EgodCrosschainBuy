#!/bin/bash
npx hardhat compile

npx hardhat --network dogechain deploy --tags EgodXCReciever && npx hardhat --network bsc deploy --tags EgodXCSender
echo Deployment complete

cp deployments/bsc/EgodXCSender.json ../Server/src/deployments/bsc/EgodXCSender.json
echo Copied EgodXCSender deployment from Hardhat to Server

cp deployments/dogechain/EgodXCReciever.json ../Server/src/deployments/dogechain/EgodXCReciever.json
echo Copied EgodXCReciever deployment from Hardhat to Server

echo
echo FINISHED!