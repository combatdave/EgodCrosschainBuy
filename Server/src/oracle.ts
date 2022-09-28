import { Contract, ethers } from "ethers";
import { contract_egodXCSender_bsc, getDogechainRecieverContract, oracleWallet } from "./connections";
import { Logger } from "./logs";
import { Transmuter_Base, PayoutData } from "./bridge";


export class Oracle {
    private _finishedTransactionHashes: {[txhash: string]: string} = {};

    public getFinishedTransactionHash(txhash: string) : string | undefined {
        if (this._finishedTransactionHashes.hasOwnProperty(txhash.toLowerCase())) {
            return this._finishedTransactionHashes[txhash.toLowerCase()];
        }
        return;
    }

    private setFinishedTransactionHash(txHash: string, oracleTxHash: string) {
        this._finishedTransactionHashes[txHash.toLowerCase()] = oracleTxHash.toLowerCase();
    }

    constructor(public bridge: Transmuter_Base) {
        this.bridge.onPayoutDataAssembled.subscribe(async (data: PayoutData) => {
            this.checkAndPush(data);
        });
    }

    private async checkAndPush(payoutData: PayoutData) {
        if (this.getFinishedTransactionHash(payoutData.txhash)) {
            return;
        }

        const alreadyProcessed = await this.isPayoutProcessed(payoutData);
        if (alreadyProcessed) {
            this.getOraclePayoutTransaction(payoutData.txhash);
            return;
        }

        if (!alreadyProcessed) {
            const oracleTxHash = await this.pushDataToXCReciever(payoutData);
            if (oracleTxHash) {
                this.setFinishedTransactionHash(payoutData.txhash, oracleTxHash);
            }
        }
    }

    private async pushDataToXCReciever(payoutData: PayoutData): Promise<string | undefined> {
        if (payoutData.bridgedToken == "DOGE") {
            const wDogeValue = payoutData.amount.mul("10000000000");
            console.log("↘️  Oracle pushing data to EgodXCR:");
            console.log("↘️  BSC Tx Hash: " + payoutData.txhash);
            console.log("↘️  Dogechain Token Address: " + payoutData.DCTokenAddress);
            console.log("↘️  Amount: " + ethers.utils.formatEther(wDogeValue) + "wDOGE");

            Logger.Log({message: "↘️  Oracle pushing data to EgodXCR:", outTxHash: payoutData.txhash, wDogeValue: wDogeValue.toString(), buyer: payoutData.buyer});
            try {
                const contract = getDogechainRecieverContract(payoutData.egodRecieverContract);
                let tx = await contract.connect(oracleWallet).processBuy(payoutData.txhash, wDogeValue, payoutData.buyer) as ethers.ContractTransaction;
                console.log("↘️  ✔️ Oracle tx:", tx.hash);
                let reciept = tx.wait();
                console.log("↘️  ✔️ Oracle work complete");
                return tx.hash;
            } catch (e) {
                console.error("↘️  ❌ ORACLE ERROR:", e);
            }
        } else if (payoutData.bridgedToken == "BUSD") {
            const busdValue = payoutData.amount;
            console.log("↘️  Oracle pushing data to EgodXCR:");
            console.log("↘️  BSC Tx Hash: " + payoutData.txhash);
            console.log("↘️  Dogechain Token Address: " + payoutData.DCTokenAddress);
            console.log("↘️  Amount: " + ethers.utils.formatEther(busdValue) + "BUSD");

            Logger.Log({message: "↘️  Oracle pushing data to EgodXCR:", outTxHash: payoutData.txhash, wDogeValue: busdValue.toString(), buyer: payoutData.buyer});
            try {
                const contract = getDogechainRecieverContract(payoutData.egodRecieverContract);
                let tx = await contract.connect(oracleWallet).processBuyWithBUSD(payoutData.txhash, busdValue, payoutData.buyer) as ethers.ContractTransaction;
                console.log("↘️  ✔️ Oracle tx:", tx.hash);
                let reciept = tx.wait();
                console.log("↘️  ✔️ Oracle work complete");
                return tx.hash;
            } catch (e) {
                console.error("↘️  ❌ ORACLE ERROR:", e);
            }
        }
    }

    private async isPayoutProcessed(payoutData: PayoutData): Promise<boolean> {
        const contract = await this.getRecieverForDogechainToken(payoutData.DCTokenAddress);
        if (contract) {
            return await contract.isProcessed(payoutData.txhash);
        }
        return false;
    }

    public async checkBSCTransaction(txhash: string): Promise<boolean | string> {
        const eventData = await this.bridge.findEgodCrossChainBuyEventFromTx(txhash);
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
        delete this._finishedTransactionHashes[txhash.toLowerCase()];
        return await this.bridge.manualProcessBSCTransaction(txhash);
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

    private async getOraclePayoutTransaction(bscTxHash: string): Promise<string | undefined> {
        const oracleTxHash = this.getFinishedTransactionHash(bscTxHash);
        if (oracleTxHash) {
            return oracleTxHash;
        }

        const oraclePayoutTxHash = await this.bridge.findOraclePayoutTxForBSCTxHash(bscTxHash);
        if (oraclePayoutTxHash) {
            this.setFinishedTransactionHash(bscTxHash, oraclePayoutTxHash);
        }
        return oraclePayoutTxHash
    }

    public async getTransactionStatus(txhash: string) {
        const status = await this.checkBSCTransaction(txhash);
        if (status == undefined) {
            return {
                status: "unknown",
            }
        }
        else if (status == true) {
            return {
                status: "complete",
                oracleTxHash: await this.getOraclePayoutTransaction(txhash)
            }
        }
        else {
            return {
                status: status,
            }
        }
    }
}