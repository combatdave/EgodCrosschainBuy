import { BigNumber, Contract, ethers } from "ethers";
import { contract_egodXCSender_bsc } from "../connections";
import { Bridgedogev3BSCWatcher, EgodCrossChainBuyEvent } from "./bridgedogev3-bsc";
import bsc_abi from "./bridgedoge_bsc_abi.json";
import dogechain_abi from "./bridgedoge_dogechain_abi.json";
import { Bridgedoge_DogeChain, BSCtoDCCallData as BridgedogeBSCtoDCParams } from "./bridgedogev3-dogechain";
import { Subject } from "rxjs";

const BRIDGEDOGE_BSC_ADDR = "0x62b8aeb90f3fa3a46607f266e882c4e9cb98f3da";
const BRIDGEDOGE_DOGECHAIN_ADDR = "0x13DC2D5BbE8471406eE82121FC33A4F7DaBe8B88";

export type PayoutData = {
    txhash: string;
    buyer: string;
    egodRecieverContract: string;
    DCTokenAddress: string;
    amount: BigNumber;
}

export class BridgeDogeV3 {

    public onPayoutDataAssembled = new Subject<PayoutData>();

    private recievers: string[] = [];

    constructor(public provider_bsc: ethers.providers.JsonRpcProvider, public provider_dogechain: ethers.providers.JsonRpcProvider) {

        this.loadRecievers();

        let dogechainWatcher = new Bridgedoge_DogeChain();

        dogechainWatcher.onBridgedogeBSCtoDCCall.subscribe(async (data: BridgedogeBSCtoDCParams) => {
            if (this.isEgodReciever(data.recieverAddr)) {
                const egodEvent = await this.findEgodCrossChainBuyEvent(data.id);
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

        dogechainWatcher.watch();
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
}