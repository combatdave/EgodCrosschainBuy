import { ethers } from "ethers";
import { Bridgedogev3BSCWatcher } from "./bridgedogev3-bsc";
import { Bridgedoge_DogeChain, BSCtoDCCallData as BridgedogeBSCtoDCParams } from "./bridgedogev3-dogechain";
import { Transmuter_Base, EgodCrossChainBuy, PayoutData } from "../bridge";
import { contract_egodXCSender_bsc } from "../connections";

export class BridgeDogeV3 extends Transmuter_Base {

    private dogechainWatcher: Bridgedoge_DogeChain;
    private recievers: string[] = [];

    constructor(public provider_src: ethers.providers.JsonRpcProvider, public provider_dogechain: ethers.providers.JsonRpcProvider) {
        super(provider_src, provider_dogechain);

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
                        amount: egodEvent.amountDoge,
                        dogechainBridgeTxHash: data.brdigeTxHash,
                        bridgedToken: "DOGE"
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

    protected isEgodReciever(address: string): boolean {
        return this.recievers.includes(address);
    }

    public async findEgodCrossChainBuyEvent(bridgeId: number) : Promise<EgodCrossChainBuy | undefined>{
        return await Bridgedogev3BSCWatcher.findEgodCrossChainBuyEvent(bridgeId);
    }

    public async findEgodCrossChainBuyEventFromTx(txhash: string) : Promise<EgodCrossChainBuy | undefined>{
        return await Bridgedogev3BSCWatcher.findEgodCrossChainBuyEventFromTx(txhash);
    }

    public async findOraclePayoutForBSCTxHash(txhash: string) {
        return await this.dogechainWatcher.findOraclePayoutTxForBSCTxHash(txhash);
    }

    public async manualProcessBSCTransaction(txhash: string): Promise<boolean> {
        console.log("BridgeDogeV3 manualProcessBSCTransaction:", txhash);
        let success = false;
        const egodEvent = await this.findEgodCrossChainBuyEventFromTx(txhash);
        if (egodEvent && egodEvent.bridgeId) {
            const bscToDCData = await this.dogechainWatcher.findBSCtoDCForBridgeId(egodEvent.bridgeId);
            if (bscToDCData) {
                const payoutData: PayoutData = {
                    txhash: egodEvent.txhash,
                    buyer: egodEvent.buyer,
                    egodRecieverContract: bscToDCData.recieverAddr,
                    DCTokenAddress: egodEvent.DCTokenAddress,
                    amount: bscToDCData.amountRecieved,
                    dogechainBridgeTxHash: bscToDCData.brdigeTxHash,
                    bridgedToken: "DOGE"
                }

                this.onPayoutDataAssembled.next(payoutData);

                success = true;
            }
        }
        return success;
    }
}