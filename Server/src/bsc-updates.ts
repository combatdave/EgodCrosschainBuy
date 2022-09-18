import { BigNumber, Contract, ethers } from "ethers";
import { Subject } from "rxjs";
import { contract_egodXCSender_bsc } from "./connections";


export type EgodCrossChainBuyData = {
    hash: string,
    buyer: string,
    dcTokenToBuy: string;
    amountSent: BigNumber,
    timestamp: Date,
    recieverContractAddress: string,
    processing?: boolean,
    dogechainTxHash?: string
}


export class BSCEgodXCSenderWatcher {

    public onNewCrossChainBuyData: Subject<EgodCrossChainBuyData> = new Subject<EgodCrossChainBuyData>();

    private egodCrossChainBuyTopic: string;
    
    constructor(public contract_egodXCSender: Contract, public provider: ethers.providers.JsonRpcProvider) {
        this.listen();

        this.egodCrossChainBuyTopic = contract_egodXCSender_bsc.interface.getEventTopic("egodCrossChainBuy");
    }

    private listen() {
        this.contract_egodXCSender.on(this.contract_egodXCSender.filters["egodCrossChainBuy(address,address,uint256)"](),
        async (buyer: string, dcTokenAddress: string, amountIn: BigNumber, event: ethers.Event) => {
            console.log("egodCrossChainBuy", buyer, dcTokenAddress, amountIn.toString(), event.transactionHash);
            try {
                await this.processHash(event.transactionHash);
            } catch (e) {
                console.log("Error processing hash", e);
            }
        });
    }

    public async processHash(txhash: string): Promise<boolean> {
        let transaction: ethers.providers.TransactionResponse | undefined;
        try {
            transaction = await this.provider.getTransaction(txhash);
        } catch (e) {
            console.log("Error getting transaction for", txhash, "error:", e);
            return false;
        }
        if (!transaction) {
            console.log("No transaction found for", txhash);
            return false;
        }

        let reciept = await transaction.wait();

        let egodCrossChainBuyLog: ethers.providers.Log | undefined = reciept.logs.find((e: ethers.providers.Log) => {
            const topic = e.topics[0].toLowerCase() === this.egodCrossChainBuyTopic.toLowerCase();
            const addr = e.address.toLowerCase() === this.contract_egodXCSender.address.toLowerCase();
            return topic && addr;
        });
        let bridgedogeBscReceivedLog: ethers.providers.Log | undefined = reciept.logs.find((e: ethers.providers.Log) => {
            const topic = e.topics[0].toLowerCase() === "0x5bf41c6e2575f42f5a4a764315afc27f02404829c16cd31f2ac50e4628676964".toLowerCase();
            const addr = e.address.toLowerCase() === "0xf2d3f911fd3377dc979fdb3060d9c79da99592c4".toLowerCase();
            return topic && addr;
        });

        if (egodCrossChainBuyLog && bridgedogeBscReceivedLog) {
            const buyLog = this.contract_egodXCSender.interface.parseLog(egodCrossChainBuyLog);
            const buyer = buyLog.args.buyer;
            const dcTokenAddress = buyLog.args.DCTokenAddress;
            const amountSentPreTax = buyLog.args.amountDoge;
            const [requestor, amountSentPostTax] = ethers.utils.defaultAbiCoder.decode(["address", "uint256"], bridgedogeBscReceivedLog.data);
            const buyData: EgodCrossChainBuyData = {
                hash: txhash,
                buyer: buyer,
                amountSent: amountSentPostTax,
                dcTokenToBuy: dcTokenAddress,
                recieverContractAddress: requestor,
                timestamp: new Date(),
            }

            console.log("BSC Updater: Successfuly found data for", txhash);

            this.onNewCrossChainBuyData.next(buyData);

            return true;
        }

        return false;
    }
}