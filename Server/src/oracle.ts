import { Contract, ethers } from "ethers";
import { getDogechainRecieverContract_BUSD, getDogechainRecieverContract_WDOGE, oracleWallet, provider_bsc, provider_dogechain } from "./connections";
import { Logger } from "./logs";
import { Transmuter_Base, PayoutData } from "./bridge";

// export type Token = {
//     name: string;
//     address: string;
// }

// export type EndpointConfig = {
//     chainId: number;
//     provider: ethers.providers.JsonRpcProvider
//     tokenIn: Token;
//     tokenOut: Token;
//     transmuterContractAddress: string;
// }

// export enum BridgeProvider { NONE, BRIDGEDOGE };

// export type OracleConfig = {
//     bridgeProvider: BridgeProvider;
//     fromChain: EndpointConfig;
//     toChain: EndpointConfig;
// }

// const Cfg_BridgeDoge: OracleConfig = {
//     bridgeProvider: BridgeProvider.BRIDGEDOGE,
//     fromChain: {
//         chainId: 56,
//         provider: provider_bsc,
//         tokenIn: {
//             name: "BNB",
//             address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
//         },
//         tokenOut: {
//             name: "DOGE",
//             address: "0xba2ae424d960c26247dd6c32edc70b295c744c43"
//         },
//         transmuterContractAddress: "0xAbcff2BC7C27BC0F3b6F8b7c84212f52Fe66F0b8"
//     },
//     toChain: {
//         chainId: 2000,
//         provider: provider_dogechain,
//         tokenIn: {
//             name: "WWDOGE",
//             address: "0xb7ddc6414bf4f5515b52d8bdd69973ae205ff101"
//         },
//         tokenOut: {
//             name: "$SAVIOR",
//             address: "0xBfbb7B1d22FF521a541170cAFE0C9A7F20d09c3B"
//         },
//         transmuterContractAddress: "0xAbcff2BC7C27BC0F3b6F8b7c84212f52Fe66F0b8"
//     }
// }


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
        this.bridge.onNewPayoutData.subscribe(async (data: PayoutData) => {
            this.checkAndPush(data);
        });
    }

    private async checkAndPush(payoutData: PayoutData) {
        if (this.getFinishedTransactionHash(payoutData.src_txhash)) {
            console.log("ℹ️ ", payoutData.src_txhash, "- Already processed");
            return;
        }

        const alreadyProcessed = await this.isPayoutProcessed(payoutData);
        if (alreadyProcessed) {
            this.getOraclePayoutTransaction(payoutData.src_txhash);
            console.log("ℹ️ ", payoutData.src_txhash, "- Already processed");
            return;
        }

        if (!alreadyProcessed) {
            const oracleTxHash = await this.pushDataToXCReciever(payoutData);
            if (oracleTxHash) {
                this.setFinishedTransactionHash(payoutData.src_txhash, oracleTxHash);
            }
        }
    }

    private async pushDataToXCReciever(payoutData: PayoutData): Promise<string | undefined> {
        if (payoutData.bridgedToken == "DOGE") {
            const wDogeValue = payoutData.amount.mul("10000000000");
            console.log("↘️  ORACLE STARTING PROCESSING:");
            console.log("↘️  BSC Tx Hash: " + payoutData.src_txhash);
            console.log("↘️  Dogechain Token Address: " + payoutData.DCTokenAddress);
            console.log("↘️  Amount: " + ethers.utils.formatEther(wDogeValue) + "wDOGE");

            Logger.Log({message: "↘️  Oracle pushing data to EgodXCR:", outTxHash: payoutData.src_txhash, wDogeValue: wDogeValue.toString(), buyer: payoutData.buyer});
            try {
                const contract = getDogechainRecieverContract_WDOGE(payoutData.egodRecieverContract);
                let tx = await contract.connect(oracleWallet).processBuy(payoutData.src_txhash, wDogeValue, payoutData.buyer) as ethers.ContractTransaction;
                console.log("↘️  ✔️ Oracle tx:", tx.hash);
                let reciept = tx.wait();
                console.log("↘️  ✔️ Oracle work complete");
                return tx.hash;
            } catch (e) {
                console.error("↘️  ❌ ORACLE ERROR:", e);
            }
        } else if (payoutData.bridgedToken == "BUSD") {
            const busdValue = payoutData.amount;
            console.log("↘️  ORACLE STARTING PROCESSING:");
            console.log(payoutData);
            console.log("↘️  Amount: " + ethers.utils.formatEther(busdValue) + " BUSD");

            Logger.Log({message: "↘️  Oracle pushing data to EgodXCR:", outTxHash: payoutData.src_txhash, wDogeValue: busdValue.toString(), buyer: payoutData.buyer});
            try {
                const contract = getDogechainRecieverContract_BUSD(payoutData.egodRecieverContract);
                let tx = await contract.connect(oracleWallet).processBuy_BUSD(payoutData.src_txhash, busdValue, payoutData.buyer) as ethers.ContractTransaction;
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
        const contract = await this.getRecieverContract();
        if (contract) {
            return await contract.isProcessed(payoutData.src_txhash);
        }
        return false;
    }

    public async checkBSCTransaction(txhash: string): Promise<boolean | string> {
        const eventData = await this.bridge.findEgodCrossChainBuyEventFromTx(txhash);
        if (!eventData) {
            return "Couldn't find EgodCrossChainBuy event for txhash";
        }
        const contract = await this.getRecieverContract();
        if (contract) {
            let processed = await contract.isProcessed(txhash);
            if (processed) {
                return true;
            } else {
                return "pending";
            }
        }
        return "Couldn't find Transmuter reciever contract for " + eventData.DCTokenAddress;
    }

    public async processHash(txhash: string) : Promise<boolean> {
        delete this._finishedTransactionHashes[txhash.toLowerCase()];
        return await this.bridge.manualProcessBSCTransaction(txhash);
    }


    public async getRecieverContract(): Promise<Contract | undefined>{
        return this.bridge.getRecieverContract();
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