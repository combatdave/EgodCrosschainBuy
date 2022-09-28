import { BigNumber, Contract, ethers } from "ethers";
import { Subject } from "rxjs";
import { contract_egodXCSender_bsc, oracleWallet } from "./connections";

export type BridgeToken = "DOGE" | "BUSD";

export type PayoutData = {
    txhash: string;
    buyer: string;
    egodRecieverContract: string;
    DCTokenAddress: string;
    amount: BigNumber;
    dogechainBridgeTxHash: string;
    bridgedToken: BridgeToken;
}

export type EgodCrossChainBuy = {
    txhash: string;
    buyer: string;
    DCTokenAddress: string;
    amountDoge: BigNumber;
    bridgeId?: any;
}

export const DOGECHAIN_API_BASE = "https://explorer.dogechain.dog";


export abstract class Transmuter_Base {
    public onPayoutDataAssembled = new Subject<PayoutData>();

    constructor(public provider_src: ethers.providers.JsonRpcProvider, public provider_dogechain: ethers.providers.JsonRpcProvider) {
        
    }

    protected abstract isEgodReciever(address: string): boolean;

    public abstract findEgodCrossChainBuyEvent(id: any) : Promise<EgodCrossChainBuy | undefined>;

    public abstract findEgodCrossChainBuyEventFromTx(txhash: string) : Promise<EgodCrossChainBuy | undefined>;

    public abstract manualProcessBSCTransaction(txhash: string): Promise<boolean>;

    private async getBlockNumber() {
        const getBlockNumberURL = DOGECHAIN_API_BASE + "/api?module=block&action=eth_block_number";
        const d = await ethers.utils.fetchJson(getBlockNumberURL);
        return parseInt(d.result, 16);
    }

    public async findOraclePayoutTxForBSCTxHash(bscTxHash: string): Promise<string | undefined> {
        const blockNumber = await this.getBlockNumber();
        const toBlock = blockNumber;

        const url = `${DOGECHAIN_API_BASE}/api?module=account&action=txlist&address=${oracleWallet.address}&endBlock=${toBlock}`;
        const d = await ethers.utils.fetchJson(url);
        const logs = d.result;

        for (let i=0; i<logs.length; i++) {
            let log = logs[i];

            try {
                const [txhash, amountWDOGE, reciever] = ethers.utils.defaultAbiCoder.decode(["bytes32", "uint256", "address"], ethers.utils.hexDataSlice(log.input, 4));
                if (txhash.toLowerCase() == bscTxHash.toLowerCase()) {
                    return log.hash;
                }
            } catch (e) {

            }
        }

    }  
}