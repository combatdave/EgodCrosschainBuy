import { BigNumber, ethers } from "ethers";
import { EgodCrossChainBuy } from "../bridge";
import { contract_egodXCSender_bsc, provider_bsc } from "../connections";

export class Bridgedogev3BSCWatcher {
    
    constructor() {
    }

    public static async findEgodCrossChainBuyEvent(bridgedogeBridgeId: number) : Promise<EgodCrossChainBuy | undefined> {
        const egodSenderAddress = contract_egodXCSender_bsc.address;
        const url = `https://api.bscscan.com/api?module=logs&action=getLogs&address=${egodSenderAddress}&apikey=T9IBQYS4IV3SCFZRCP8V5U58N2PPGZ1MKR`;
        const fetched = await ethers.utils.fetchJson(url);
        const logs = fetched.result;

        for (let i=0; i<logs.length; i++) {
            const log = logs[i];
            const parsed = contract_egodXCSender_bsc.interface.parseLog(log);
            if (parsed.name == "egodCrossChainBuy_BridgeDoge") {
                if (parsed.args.bridgeId.toNumber() == bridgedogeBridgeId) {
                    const params: EgodCrossChainBuy = {
                        txhash: log.transactionHash,
                        buyer: parsed.args.buyer,
                        DCTokenAddress: parsed.args.DCTokenAddress,
                        bridgeId: parsed.args.bridgeId.toNumber(),
                        amountDoge: parsed.args.amountDoge
                    };
                    return params;
                }
            }
        }
    }

    public static async findEgodCrossChainBuyEventFromTx(txhash: string) : Promise<EgodCrossChainBuy | undefined> {
        try {
            const reciept = await provider_bsc.getTransactionReceipt(txhash);

            const logs = reciept.logs;

            for (let i=0; i<logs.length; i++) {
                const log = logs[i];
                try {
                    const parsed = contract_egodXCSender_bsc.interface.parseLog(log);
                    if (parsed.name == "egodCrossChainBuy_BridgeDoge") {
                        const params: EgodCrossChainBuy = {
                            txhash: log.transactionHash,
                            buyer: parsed.args.buyer,
                            DCTokenAddress: parsed.args.DCTokenAddress,
                            bridgeId: parsed.args.bridgeId.toNumber(),
                            amountDoge: parsed.args.amountDoge
                        };
                        return params;
                    }
                } catch (e) {
                }
            }
        } catch (e) {
            console.log("Error in findEgodCrossChainBuyEventFromTx for hash", txhash, ":", e);
        }

        return undefined;
    }
}