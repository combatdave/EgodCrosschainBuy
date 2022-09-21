import { BigNumber, Contract, ethers } from "ethers";
import { contract_egodXCSender_bsc } from "../connections";
import { Bridgedogev3BSCWatcher, EgodCrossChainBuyEvent } from "./bridgedogev3-bsc";
import bsc_abi from "./bridgedoge_bsc_abi.json";
import dogechain_abi from "./bridgedoge_dogechain_abi.json";
import { Bridgedoge_DogeChain, BSCtoDCCallData as BridgedogeBSCtoDCParams } from "./bridgedogev3-dogechain";
import { Subject } from "rxjs";

export type PayoutData = {
    txhash: string;
    buyer: string;
    egodRecieverContract: string;
    DCTokenAddress: string;
    amount: BigNumber;
}

export class BridgeDogeV3 {

    public onPayoutDataAssembled = new Subject<PayoutData>();
    private dogechainWatcher: Bridgedoge_DogeChain;

    private recievers: string[] = [];

    constructor(public provider_bsc: ethers.providers.JsonRpcProvider, public provider_dogechain: ethers.providers.JsonRpcProvider) {

        this.loadRecievers();

        this.dogechainWatcher = new Bridgedoge_DogeChain();

        this.dogechainWatcher.onBridgedogeBSCtoDCCall.subscribe(async (data: BridgedogeBSCtoDCParams) => {
            if (this.isEgodReciever(data.recieverAddr)) {
                const egodEvent = await this.findEgodCrossChainBuyEvent(data.id);
                // console.log("BridgeDoge BSCtoDC(", data.id, ") => EgodCrossChainBuyEvent:", egodEvent);
                if (egodEvent) {
                    const payoutData: PayoutData = {
                        txhash: egodEvent.txhash,
                        buyer: egodEvent.buyer,
                        egodRecieverContract: data.recieverAddr,
                        DCTokenAddress: egodEvent.DCTokenAddress,
                        amount: egodEvent.amountDoge
                    }

                    this.onPayoutDataAssembled.next(payoutData);
                }
            }
        });

        this.dogechainWatcher.watch();
    }

    private async loadRecievers() {
        this.recievers = await contract_egodXCSender_bsc.getRecievers() as string[];
    }

    private isEgodReciever(address: string): boolean {
        return this.recievers.includes(address);
    }

    public async findEgodCrossChainBuyEvent(bridgeId: number) : Promise<EgodCrossChainBuyEvent | undefined>{
        return await Bridgedogev3BSCWatcher.findEgodCrossChainBuyEvent(bridgeId);
    }

    public async findEgodCrossChainBuyEventFromTx(txhash: string) : Promise<EgodCrossChainBuyEvent | undefined>{
        return await Bridgedogev3BSCWatcher.findEgodCrossChainBuyEventFromTx(txhash);
    }

    public async manualProcessBSCTransaction(txhash: string): Promise<boolean> {
        let success = false;
        const egodEvent = await this.findEgodCrossChainBuyEventFromTx(txhash);
        if (egodEvent) {
            const bscToDCData = await this.dogechainWatcher.findBSCtoDCForBridgeId(egodEvent.bridgeId);
            if (bscToDCData) {
                const payoutData: PayoutData = {
                    txhash: egodEvent.txhash,
                    buyer: egodEvent.buyer,
                    egodRecieverContract: bscToDCData.recieverAddr,
                    DCTokenAddress: egodEvent.DCTokenAddress,
                    amount: egodEvent.amountDoge
                }

                this.onPayoutDataAssembled.next(payoutData);

                success = true;
            }
        }
        return success;
    }
}