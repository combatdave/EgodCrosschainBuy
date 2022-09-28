import {BigNumber, ethers} from "ethers";
import { Subject } from "rxjs";
import { DOGECHAIN_API_BASE } from "../bridge";
import { DogechainReader_API } from "../dogechain-reader";

export const SYNAPSE_DC_ADDRESS = "0x9508bf380c1e6f751d97604732ef1bae6673f299";
// https://explorer.dogechain.dog/tx/0x9361044493d6fefd2489bdbae5ce715d760b64861c4f5b1487f8a1df6cb3f373
const SYNAPSE_ABI = [{"inputs":[{"internalType":"address payable","name":"to","type":"address"},{"internalType":"contract IERC20Mintable","name":"token","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"fee","type":"uint256"},{"internalType":"bytes32","name":"kappa","type":"bytes32"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"}];
const SYNAPSE_INTERFACE = new ethers.utils.Interface(SYNAPSE_ABI);


export type SynapseMintCallData = {
    synapseTxHash: string;
    kappa: string;
    amountRecieved: BigNumber;
    recieverAddr: string;
}

export class Synapse_DogeChain {
    
    public onSynapseMintCall: Subject<SynapseMintCallData> = new Subject<SynapseMintCallData>();
    private callsByTxHash: {[txhash: string]: SynapseMintCallData} = {};
    private dogechainApiReader: DogechainReader_API = new DogechainReader_API(SYNAPSE_DC_ADDRESS);

    constructor() {
        this.dogechainApiReader.onNewLog.subscribe((log) => {
            const callData = this.processLog(log);
            this.onSynapseMintCall.next(callData);
        });
    }

    private processLog(log: any): SynapseMintCallData | undefined {
        if (this.callsByTxHash.hasOwnProperty(log.hash)) {
            return;
        }

        let callData: SynapseMintCallData | undefined = undefined;

        let data: string = log.input;
        try {
            const result = SYNAPSE_INTERFACE.decodeFunctionData("mint", data);
            callData = {
                synapseTxHash: log.hash,
                kappa: result.kappa,
                amountRecieved: result.amount,
                recieverAddr: result.to
            }
        } catch (e) {
            console.error(e);
        }

        if (callData) {
            this.callsByTxHash[log.hash] = callData;
        }

        return callData;
    }

    public async findSynapseMintForKappa(kappa: string): Promise<SynapseMintCallData | undefined> {
        for (let txhash in this.callsByTxHash){
            const callData = this.callsByTxHash[txhash];
            if (callData.kappa == kappa) {
                return callData;
            }
        }

        return undefined;
    }
}




