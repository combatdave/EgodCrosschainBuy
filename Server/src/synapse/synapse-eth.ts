import { EgodCrossChainBuy } from "../bridge";
import { contract_egodXCSender_bsc, provider_eth } from "../connections";

const EVENT_NAME = "egodCrossChainBuy_Synapse_WETH";

export class SynapseEthWatcher {
    private static egodCrossChainBuyByTxHash: {[txhash: string]: EgodCrossChainBuy} = {};
    
    constructor() {
    }

    public static async findEgodCrossChainBuyEvent(kappa: string) : Promise<EgodCrossChainBuy | undefined> {
        return SynapseEthWatcher.findEgodCrossChainBuyEventFromTx(kappa);
    }

    public static async findEgodCrossChainBuyEventFromTx(txhash: string) : Promise<EgodCrossChainBuy | undefined> {
        if (SynapseEthWatcher.egodCrossChainBuyByTxHash.hasOwnProperty(txhash)) {
            return SynapseEthWatcher.egodCrossChainBuyByTxHash[txhash];
        }

        let crossChainBuy: EgodCrossChainBuy | undefined = undefined;
        try {
            const reciept = await provider_eth.getTransactionReceipt(txhash);
            const logs = reciept.logs;

            for (let i=0; i<logs.length; i++) {
                const log = logs[i];
                try {
                    const parsed = contract_egodXCSender_bsc.interface.parseLog(log);
                    if (parsed.name == EVENT_NAME) {
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
            console.log("Error in Synapse ETH findEgodCrossChainBuyEventFromTx for hash", txhash, ":", e);
        }

        if (crossChainBuy) {
            SynapseEthWatcher.egodCrossChainBuyByTxHash[txhash] = crossChainBuy;
        }
        return crossChainBuy;
    }
}