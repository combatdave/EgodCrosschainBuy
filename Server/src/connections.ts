import { Contract, ethers } from "ethers";
import Deployment_EgodXCR_Doge from "./deployments/dogechain/EgodXCReciever_Doge.json";
import Deployment_EgodXCR_BUSD from "./deployments/dogechain/EgodXCReciever_BUSD.json";
import EgodXCSenderDeployment from "./deployments/bsc/EgodXCSender.json";
import * as dotenv from "dotenv";

dotenv.config();

export const DC_SAVIOR_ADDR = "0xBfbb7B1d22FF521a541170cAFE0C9A7F20d09c3B";

export const provider_bsc = new ethers.providers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
export const provider_eth = new ethers.providers.JsonRpcProvider("https://rpc.ankr.com/eth");
export const provider_dogechain = new ethers.providers.JsonRpcProvider("https://rpc.bridgedoge.dog/rpc-d53206731492e013262096ab1c12b373-auth");

export const oracleWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider_dogechain);

export const contract_egodXCSender_bsc = new Contract(EgodXCSenderDeployment.address, EgodXCSenderDeployment.abi, provider_bsc);
export const egodXCRecieverInterface = new ethers.utils.Interface(Deployment_EgodXCR_Doge.abi);
// export const contract_egodXCReciever_dogechain = new Contract(EgodXCRDeployment.address, EgodXCRDeployment.abi, provider_dogechain);

export const BUSD_Reciever_Deployment = Deployment_EgodXCR_BUSD;
export const BUSD_Reciever_Interface = new ethers.utils.Interface(Deployment_EgodXCR_BUSD.abi);

export function getDogechainRecieverContract_WDOGE(address: string): Contract  {
    return new Contract(address, Deployment_EgodXCR_Doge.abi, provider_dogechain);
}

export function getDogechainRecieverContract_BUSD(address: string): Contract {
    return new Contract(address, Deployment_EgodXCR_BUSD.abi, provider_dogechain);
}

export function senderAddress() {
    return contract_egodXCSender_bsc.address;
}