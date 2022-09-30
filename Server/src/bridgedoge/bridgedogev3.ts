import { ethers } from "ethers";
import { Bridgedogev3BSCWatcher } from "./bridgedogev3-bsc";
import { Bridgedoge_DogeChain, BSCtoDCCallData as BridgedogeBSCtoDCParams } from "./bridgedogev3-dogechain";
import { Transmuter_Base, EgodCrossChainBuy, PayoutData } from "../bridge";
import { contract_egodXCSender_bsc, egodXCRecieverInterface } from "../connections";

export class BridgeDogeV3 extends Transmuter_Base {

    private dogechainWatcher: Bridgedoge_DogeChain;
    private recieverAddress: string = "";

    constructor(public provider_src: ethers.providers.JsonRpcProvider, public provider_dogechain: ethers.providers.JsonRpcProvider) {
        super(provider_src, provider_dogechain);

        this.start();
    }

    private async start() {
        await this.loadRecieverAddress();
        this.dogechainWatcher = new Bridgedoge_DogeChain();

        console.log("ℹ️  ====== BridgeDogeV3 Ready ======");
        console.log("ℹ️  Sender address:", Bridgedogev3BSCWatcher.senderAddress());
        console.log("ℹ️  Reciever address:", this.recieverAddress);

        this.dogechainWatcher.onNewBridgedogeBSCtoDCCall.subscribe(async (data: BridgedogeBSCtoDCParams) => {
            if (this.isEgodReciever(data.recieverAddr)) {
                console.log("ℹ️  New BSCtoDC to EgodXCReciever:", data.id);
                const egodEvent = await this.findEgodCrossChainBuyEvent(data.id);
                if (egodEvent) {
                    console.log("     BridgeDogeV3 found EgodCrossChainBuyEvent for bridgeId", data.id, ":", egodEvent.txhash);
                    const payoutData: PayoutData = {
                        src_txhash: egodEvent.txhash,
                        buyer: egodEvent.buyer,
                        egodRecieverContract: data.recieverAddr,
                        DCTokenAddress: egodEvent.DCTokenAddress,
                        amount: egodEvent.amount,
                        dogechainBridgeTxHash: data.bridgeTxHash,
                        bridgedToken: "DOGE"
                    }
                    this.onNewPayoutData.next(payoutData);
                } else {
                    console.log("     BridgeDogeV3 could not find EgodCrossChainBuyEvent for bridgeId:", data.id);
                }
            }
        });

        await this.dogechainWatcher.watch();
    }

    private async loadRecieverAddress() {
        this.recieverAddress = await contract_egodXCSender_bsc.dogechainRecieverAddress_doge();
    }

    private isEgodReciever(address: string): boolean {
        return address.toLowerCase() === this.recieverAddress.toLowerCase();
    }

    public getRecieverContract(): ethers.Contract {
        return new ethers.Contract(this.recieverAddress, egodXCRecieverInterface, this.provider_dogechain);
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
        console.log("ℹ️  BridgeDogeV3 manualProcessBSCTransaction for BridgeDoge:", txhash);
        let success = false;
        const egodEvent = await this.findEgodCrossChainBuyEventFromTx(txhash);
        if (egodEvent && egodEvent.bridgeId) {
            const bscToDCData = await this.dogechainWatcher.findBSCtoDCForBridgeId(egodEvent.bridgeId);
            if (bscToDCData) {
                const payoutData: PayoutData = {
                    src_txhash: egodEvent.txhash,
                    buyer: egodEvent.buyer,
                    egodRecieverContract: bscToDCData.recieverAddr,
                    DCTokenAddress: egodEvent.DCTokenAddress,
                    amount: bscToDCData.amountRecieved,
                    dogechainBridgeTxHash: bscToDCData.bridgeTxHash,
                    bridgedToken: "DOGE"
                }

                this.onNewPayoutData.next(payoutData);

                success = true;
            }
        }
        return success;
    }
}