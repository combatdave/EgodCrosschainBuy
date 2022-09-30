import { ethers } from "ethers";
import { EgodCrossChainBuy } from "../bridge";
import { contract_egodXCSender_bsc, provider_bsc } from "../connections";

export const SENDER_EVENT_NAME = "egodCrossChainBuy_Synapse_BUSD";

export class SynapseBSCWatcher {
    
    private senderContract: ethers.Contract;
    private buyEventByKappa: {[id: number]: EgodCrossChainBuy} = {};
    private loadingPromise: Promise<any> | undefined = undefined;

    constructor(public senderAddress) {
        this.senderContract = new ethers.Contract(senderAddress, contract_egodXCSender_bsc.interface, provider_bsc);
    }

    private async FetchEvents() {
        const url = `https://api.bscscan.com/api?module=logs&action=getLogs&address=${this.senderAddress}&apikey=T9IBQYS4IV3SCFZRCP8V5U58N2PPGZ1MKR`;
        const fetched = await ethers.utils.fetchJson(url);
        const logs = fetched.result;

        for (let i=0; i<logs.length; i++) {
            const log = logs[i];
            let parsed = undefined;
            try {
                parsed = this.senderContract.interface.parseLog(log);
            } catch {
                console.error("Failed to parse", log);
                continue;
            }
            if (parsed.name == SENDER_EVENT_NAME) {
                const kappa = this.txHashToKappa(log.transactionHash);
                const params: EgodCrossChainBuy = {
                    txhash: log.transactionHash,
                    buyer: parsed.args.buyer,
                    DCTokenAddress: parsed.args.DCTokenAddress,
                    bridgeId: kappa,
                    amount: parsed.args.amountBUSD  // This needs to be amountToken along with tokenSymbol
                };
                this.buyEventByKappa[kappa] = params;
            }
        }
    }

    private txHashToKappa(txhash: string) {
        return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(txhash));
    }

    public async findEgodCrossChainBuyEvent(kappa: string) : Promise<EgodCrossChainBuy | undefined> {
        if (!this.loadingPromise) {
            this.loadingPromise = this.FetchEvents();
        }

        await this.loadingPromise;

        if (kappa in this.buyEventByKappa) {
            return this.buyEventByKappa[kappa];
        }

        return undefined;
    }

    public async findEgodCrossChainBuyEventFromTx(txhash: string) : Promise<EgodCrossChainBuy | undefined> {
        let reciept: ethers.providers.TransactionReceipt | undefined = undefined;
        try {
            reciept = await provider_bsc.getTransactionReceipt(txhash);
        } catch (e) {
            console.error("Failed to get BSC reciept for:", txhash);
            return undefined;
        }

        const logs = reciept.logs;

        for (let i=0; i<logs.length; i++) {
            const log = logs[i];
            try {
                const parsed = this.senderContract.interface.parseLog(log);
                if (parsed.name == SENDER_EVENT_NAME) {
                    const params: EgodCrossChainBuy = {
                        txhash: log.transactionHash,
                        buyer: parsed.args.buyer,
                        DCTokenAddress: parsed.args.DCTokenAddress,
                        bridgeId: parsed.args.kappa,
                        amount: parsed.args.amountDoge
                    };
                    return params;
                }
            } catch (e) {
            }
        }

        return undefined;
    }
}