import { Contract, ethers } from "ethers";
import { contract_egodXCSender_bsc, getDogechainRecieverContract, oracleWallet } from "./connections";
import { Logger } from "./logs";
import { BridgeDogeV3, PayoutData } from "./bridgedoge/bridgedogev3";


export class Oracle {
    constructor(public bridgedoge: BridgeDogeV3) {
        this.bridgedoge.onPayoutDataAssembled.subscribe(async (data: PayoutData) => {
            this.checkAndPush(data);
        });
    }

    private async checkAndPush(payoutData: PayoutData) {
        const alreadyProcessed = await this.checkProcessedStatus(payoutData.txhash);
        if (!alreadyProcessed) {
            await this.pushDataToXCReciever(payoutData);
        }
    }

    private async pushDataToXCReciever(payoutData: PayoutData): Promise<string | undefined> {
        console.log("↘️  Oracle pushing data to EgodXCR:", payoutData.txhash, payoutData.amount.toString(), payoutData.buyer);
        Logger.Log({message: "↘️  Oracle pushing data to EgodXCR:", outTxHash: payoutData.txhash, amountRecieved: payoutData.amount.toString(), from: payoutData.buyer});
        try {
            const contract = getDogechainRecieverContract(payoutData.egodRecieverContract);
            let tx = await contract.connect(oracleWallet).processBuy(payoutData.txhash, payoutData.amount, payoutData.buyer) as ethers.ContractTransaction;
            console.log("↘️  ✔️ Oracle tx:", tx.hash);
            let reciept = tx.wait();
            console.log("↘️  ✔️ Oracle work complete");
            return tx.hash;
        } catch (e) {
            console.error("↘️  ❌ ORACLE ERROR:", e);
            return;
        }
        return;
    }

    public async checkProcessedStatus(txhash: string): Promise<boolean | undefined> {
        const eventData = await this.bridgedoge.findEgodCrossChainBuyEventFromTx(txhash);
        if (!eventData) {
            return undefined;
        }
        const contract = await this.getRecieverForDogechainToken(eventData.DCTokenAddress);
        if (contract) {
            return await contract.isProcessed(txhash);
        }
        return undefined;
    }

    public async processHash(txhash: string) : Promise<boolean> {
        return false;
    }

    private _cachedRecieversByTokenAddress: {[tokenAddress: string]: Contract} = {};

    public async getRecieverForDogechainToken(tokenAddress: string): Promise<Contract | undefined>{
        if (this._cachedRecieversByTokenAddress.hasOwnProperty(tokenAddress)) {
            return this._cachedRecieversByTokenAddress[tokenAddress];
        }

        const recieverAddress = await contract_egodXCSender_bsc.getRecieverForDCTokenAddress(tokenAddress);
        if (recieverAddress != "") {
            const contract = getDogechainRecieverContract(recieverAddress);
            this._cachedRecieversByTokenAddress[tokenAddress] = contract;
            return contract;
        }
    }

    public async getTransactionStatus(txhash: string) {
        const processed = await this.checkProcessedStatus(txhash);
        if (processed == undefined) {
            return {
                status: "unknown",
                data: undefined
            }
        }
        else if (processed == true) {
            return {
                status: "complete",
                data: undefined
            }
        }
        else {
            return {
                status: "processing",
                data: undefined
            }
        }
    }
}