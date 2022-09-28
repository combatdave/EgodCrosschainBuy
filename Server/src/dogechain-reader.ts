import { ethers } from "ethers";
import { Subject } from "rxjs";
import { DOGECHAIN_API_BASE } from "./bridge";


export class DogechainReader_API {
    private logsByTxHash: {[txhash: string]: ethers.providers.TransactionReceipt} = {};
    public onNewLog: Subject<ethers.providers.TransactionReceipt> = new Subject<ethers.providers.TransactionReceipt>();

    constructor(public address: string) {
        this._loop();
    }

    private async _fetchBlockNumber() {
        const getBlockNumberURL = DOGECHAIN_API_BASE + "/api?module=block&action=eth_block_number";
        const d = await ethers.utils.fetchJson(getBlockNumberURL);
        return parseInt(d.result, 16);
    }
    
    private async getTXList(): Promise<ethers.providers.TransactionReceipt[]> {
        const blockNumber = await this._fetchBlockNumber();

        const toBlock = blockNumber;

        const url = `${DOGECHAIN_API_BASE}/api?module=account&action=txlist&address=${this.address}&endBlock=${toBlock}`;
        const d = await ethers.utils.fetchJson(url);
        const logs = d.result as ethers.providers.TransactionReceipt[];

        return logs;
    }

    private async _loop() {
        while (true) {
            try {
                this._findNewTransactions();
            } catch (e) {
                console.error("DogeChainWatcher error polling web:", e);
            }
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
    };  

    private async _findNewTransactions() {
        try {
            const allLogs = await this.getTXList();

            allLogs.forEach((log) => {
                if (!this.logsByTxHash.hasOwnProperty(log.transactionHash)) {
                    // New log
                    this._handleNewTransaction(log);
                }
            });
        } catch (e) {
            console.error("DogeChainWatcher error polling web:", e);
        }
    }

    private async _handleNewTransaction(log: ethers.providers.TransactionReceipt) {
        this.logsByTxHash[log.transactionHash] = log;
        try {
            this.onNewLog.next(log);
        } catch (e) {
        }
    }
}