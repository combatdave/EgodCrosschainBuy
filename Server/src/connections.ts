import { Contract, ethers } from "ethers";
import EgodXCRDeployment from "./deployments/dogechain/EgodXCReciever.json";
import EgodXCSenderDeployment from "./deployments/bsc/EgodXCSender.json";
import * as dotenv from "dotenv";

dotenv.config();

export const DC_SAVIOR_ADDR = "0xBfbb7B1d22FF521a541170cAFE0C9A7F20d09c3B";

export const provider_bsc = new ethers.providers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
export const provider_eth = new ethers.providers.JsonRpcProvider("https://rpc.ankr.com/eth");
export const provider_dogechain = new ethers.providers.JsonRpcProvider("https://rpc.bridgedoge.dog/rpc-d53206731492e013262096ab1c12b373-auth");

export const oracleWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider_dogechain);

export const contract_egodXCSender_bsc = new Contract(EgodXCSenderDeployment.address, EgodXCSenderDeployment.abi, provider_bsc);
export const egodXCRecieverInterface = new ethers.utils.Interface(EgodXCRDeployment.abi);
// export const contract_egodXCReciever_dogechain = new Contract(EgodXCRDeployment.address, EgodXCRDeployment.abi, provider_dogechain);

export function getDogechainRecieverContract(address: string): Contract  {
    return new Contract(address, EgodXCRDeployment.abi, provider_dogechain);
}