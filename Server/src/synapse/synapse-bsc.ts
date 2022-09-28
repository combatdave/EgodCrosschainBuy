import { EgodCrossChainBuy } from "../bridge";
import { contract_egodXCSender_bsc, provider_bsc } from "../connections";


export class SynapseBSCWatcher {
    private static egodCrossChainBuyByTxHash: {[txhash: string]: EgodCrossChainBuy} = {};
    
    constructor() {
    }

    public static async findEgodCrossChainBuyEvent(kappa: string) : Promise<EgodCrossChainBuy | undefined> {
        return SynapseBSCWatcher.findEgodCrossChainBuyEventFromTx(kappa);
    }

    public static async findEgodCrossChainBuyEventFromTx(txhash: string) : Promise<EgodCrossChainBuy | undefined> {
        if (SynapseBSCWatcher.egodCrossChainBuyByTxHash.hasOwnProperty(txhash)) {
            return SynapseBSCWatcher.egodCrossChainBuyByTxHash[txhash];
        }

        let crossChainBuy: EgodCrossChainBuy | undefined = undefined;
        try {
            const reciept = await provider_bsc.getTransactionReceipt(txhash);
            const logs = reciept.logs;

            for (let i=0; i<logs.length; i++) {
                const log = logs[i];
                try {
                    const parsed = contract_egodXCSender_bsc.interface.parseLog(log);
                    if (parsed.name == "egodCrossChainBuy_Synapse") {
                        crossChainBuy = {
                            txhash: log.transactionHash,
                            buyer: parsed.args.buyer,
                            DCTokenAddress: parsed.args.DCTokenAddress,
                            amountDoge: parsed.args.amountDoge
                        };
                        break;
                    }
                } catch (e) {
                }
            }
        } catch (e) {
            console.log("Error in Synapse BSC findEgodCrossChainBuyEventFromTx for hash", txhash, ":", e);
        }

        if (crossChainBuy) {
            SynapseBSCWatcher.egodCrossChainBuyByTxHash[txhash] = crossChainBuy;
        }
        return crossChainBuy;
    }
}