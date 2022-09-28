import { BigNumber, ethers } from "ethers";
import { EgodCrossChainBuy } from "../bridge";
import { contract_egodXCSender_bsc, provider_bsc } from "../connections";

export class Bridgedogev3BSCWatcher {
    
    private static buyEventByBridgeId: {[id: number]: EgodCrossChainBuy} = {};
    private static loadingPromise: Promise<any> | undefined = undefined;

    constructor() {
    }

    private static async FetchEvents() {
        const egodSenderAddress = contract_egodXCSender_bsc.address;
        const url = `https://api.bscscan.com/api?module=logs&action=getLogs&address=${egodSenderAddress}&apikey=T9IBQYS4IV3SCFZRCP8V5U58N2PPGZ1MKR`;
        const fetched = await ethers.utils.fetchJson(url);
        const logs = fetched.result;

        for (let i=0; i<logs.length; i++) {
            const log = logs[i];
            let parsed = undefined;
            try {
                parsed = contract_egodXCSender_bsc.interface.parseLog(log);
            } catch {
                console.error("Failed to parse", log);
                continue;
            }
            if (parsed.name == "egodCrossChainBuy_BridgeDoge") {
                const params: EgodCrossChainBuy = {
                    txhash: log.transactionHash,
                    buyer: parsed.args.buyer,
                    DCTokenAddress: parsed.args.DCTokenAddress,
                    bridgeId: parsed.args.bridgeId.toNumber(),
                    amountDoge: parsed.args.amountDoge
                };
                Bridgedogev3BSCWatcher.buyEventByBridgeId[params.bridgeId] = params;
            }
        }
    }

    public static async findEgodCrossChainBuyEvent(bridgedogeBridgeId: number) : Promise<EgodCrossChainBuy | undefined> {
        if (!Bridgedogev3BSCWatcher.loadingPromise) {
            Bridgedogev3BSCWatcher.loadingPromise = Bridgedogev3BSCWatcher.FetchEvents();
        }

        await Bridgedogev3BSCWatcher.loadingPromise;

        if (bridgedogeBridgeId in Bridgedogev3BSCWatcher.buyEventByBridgeId) {
            return Bridgedogev3BSCWatcher.buyEventByBridgeId[bridgedogeBridgeId];
        }

        return undefined;

        // const egodSenderAddress = contract_egodXCSender_bsc.address;
        // const url = `https://api.bscscan.com/api?module=logs&action=getLogs&address=${egodSenderAddress}&apikey=T9IBQYS4IV3SCFZRCP8V5U58N2PPGZ1MKR`;
        // const fetched = await ethers.utils.fetchJson(url);
        // const logs = fetched.result;

        // for (let i=0; i<logs.length; i++) {
        //     const log = logs[i];
        //     let parsed = undefined;
        //     try {
        //         parsed = contract_egodXCSender_bsc.interface.parseLog(log);
        //     } catch {
        //         console.error("Failed to parse", log);
        //         continue;
        //     }
        //     if (parsed.name == "egodCrossChainBuy_BridgeDoge") {
        //         if (parsed.args.bridgeId.toNumber() == bridgedogeBridgeId) {
        //             const params: EgodCrossChainBuy = {
        //                 txhash: log.transactionHash,
        //                 buyer: parsed.args.buyer,
        //                 DCTokenAddress: parsed.args.DCTokenAddress,
        //                 bridgeId: parsed.args.bridgeId.toNumber(),
        //                 amountDoge: parsed.args.amountDoge
        //             };
        //             return params;
        //         }
        //     }
        // }
    }

    public static async findEgodCrossChainBuyEventFromTx(txhash: string) : Promise<EgodCrossChainBuy | undefined> {
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

        return undefined;
    }
}