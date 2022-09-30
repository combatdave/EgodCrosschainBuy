#!/bin/bash
npx hardhat compile

npx hardhat --network dogechain deploy --tags EgodXCReciever_Doge
npx hardhat --network dogechain deploy --tags EgodXCReciever_BUSD
npx hardhat --network bsc deploy --tags EgodXCSender
echo DEPLOYMENT complete
echo


cp deployments/bsc/EgodXCSender.json ../Server/src/deployments/bsc/EgodXCSender.json
cp deployments/dogechain/EgodXCReciever_Doge.json ../Server/src/deployments/dogechain/EgodXCReciever_Doge.json
cp deployments/dogechain/EgodXCReciever_BUSD.json ../Server/src/deployments/dogechain/EgodXCReciever_BUSD.json
echo COPIED DEPLOYMENTS

echo
echo FINISHED!