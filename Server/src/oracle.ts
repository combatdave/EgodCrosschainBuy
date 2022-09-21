import { Contract, ethers } from "ethers";
import { contract_egodXCSender_bsc, getDogechainRecieverContract, oracleWallet } from "./connections";
import { Logger } from "./logs";
import { BridgeDogeV3, PayoutData } from "./bridgedoge/bridgedogev3";


export class Oracle {
    public finishedTransactions: {[txhash: string]: boolean} = {};

    constructor(public bridgedoge: BridgeDogeV3) {
        this.bridgedoge.onPayoutDataAssembled.subscribe(async (data: PayoutData) => {
            this.checkAndPush(data);
        });
    }

    private async checkAndPush(payoutData: PayoutData) {
        if (this.finishedTransactions.hasOwnProperty(payoutData.txhash)) {
            if (this.finishedTransactions[payoutData.txhash] == true) return;
        }

        const alreadyProcessed = await this.isPayoutProcessed(payoutData);
        if (alreadyProcessed) {
            this.finishedTransactions[payoutData.txhash] = true;
            return;
        }

        if (!alreadyProcessed) {
            const finishTxHash = await this.pushDataToXCReciever(payoutData);
            if (finishTxHash) {
                this.finishedTransactions[payoutData.txhash] = true;
            }
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

    private async isPayoutProcessed(payoutData: PayoutData): Promise<boolean> {
        const contract = await this.getRecieverForDogechainToken(payoutData.DCTokenAddress);
        if (contract) {
            return await contract.isProcessed(payoutData.txhash);
        }
        return false;
    }

    public async checkBSCTransaction(txhash: string): Promise<boolean | string> {
        const eventData = await this.bridgedoge.findEgodCrossChainBuyEventFromTx(txhash);
        if (!eventData) {
            return "Couldn't find EgodCrossChainBuy event for txhash";
        }
        const contract = await this.getRecieverForDogechainToken(eventData.DCTokenAddress);
        if (contract) {
            return await contract.isProcessed(txhash);
        }
        return "Couldn't find Transmuter reciever contract for " + eventData.DCTokenAddress;
    }

    public async processHash(txhash: string) : Promise<boolean> {
        this.finishedTransactions[txhash] = false;
        return await this.bridgedoge.manualProcessBSCTransaction(txhash);
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
        const status = await this.checkBSCTransaction(txhash);
        if (status == undefined) {
            return {
                status: "unknown",
                data: undefined
            }
        }
        else if (status == true) {
            return {
                status: "complete",
                data: undefined
            }
        }
        else {
            return {
                status: status,
                data: undefined
            }
        }
    }
}