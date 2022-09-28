import {BigNumber, ethers} from "ethers";
import { Subject } from "rxjs";
import { egodXCRecieverInterface, oracleWallet } from "../connections";

export const BRIDGEDOGE_DC_ADDRESS = "0xB49D69115DBFe69F86f897c7a340A4d5f68f3B0c";


const API_URLS = [
    "https://explorer.dogechain.dog",
    "https://explorer.dogmoney.money"
];


export type BSCtoDCCallData = {
    bridgeTxHash: string;
    id: number;
    amountRecieved: BigNumber;
    recieverAddr: string;
}

export class Bridgedoge_DogeChain {
    
    private API_INDEX: number = 0;
    private knownBridgeCalls: {[txhash: string]: BSCtoDCCallData} = {};
    public onNewBridgedogeBSCtoDCCall: Subject<BSCtoDCCallData> = new Subject<BSCtoDCCallData>();

    constructor() {
    }

    public async watch() {
        await this.selectBestAPI();
        try {
            this.pollWeb();
        } catch (e) {
            console.error("BridgeDogeWatcher error polling web:", e);
        }
        setInterval(() => {this.pollWeb()}, 10000);
        setInterval(() => {this.selectBestAPI()}, 60000);
    };

    private async selectBestAPI() {
        let highestBlock = 0;
        let newAPI_INDEX = this.API_INDEX;
        for (let i=0; i<API_URLS.length; i++) {
            const api_url = API_URLS[i];
            try {
                const blockNumber = await this.getBlockNumber(api_url);
                if (blockNumber > highestBlock) {
                    highestBlock = blockNumber;
                    newAPI_INDEX = i;
                }
            } catch (e) {   
            }
        }

        if (newAPI_INDEX != this.API_INDEX) {
            console.log("BridgeDogeWatcher: Switching to API:", API_URLS[newAPI_INDEX]);
            this.API_INDEX = newAPI_INDEX;
        }
    }

    private get API_URL() {
        return API_URLS[this.API_INDEX];
    }

    private async getBlockNumber(api_url: string | undefined = undefined): Promise<number> {
        if (!api_url) {
            api_url = this.API_URL
        }
        const getBlockNumberURL = api_url + "/api?module=block&action=eth_block_number";
        const d = await ethers.utils.fetchJson({url: getBlockNumberURL, timeout: 3000});
        return parseInt(d.result, 16);
    }

    private async fetchTxList(): Promise<any[]> {
        const blockNumber = await this.getBlockNumber();
        const toBlock = blockNumber;
        const url = `${this.API_URL}/api?module=account&action=txlist&address=${BRIDGEDOGE_DC_ADDRESS}&endBlock=${toBlock}`;
        const d = await ethers.utils.fetchJson(url);
        const txList = d.result as any[];
        return txList;
    }

    private async pollWeb() {
        const txList = await this.fetchTxList();

        txList.forEach((tx: any) => {
            let data: string = tx.input;

            if (tx.hash in this.knownBridgeCalls) {
                return;
            }

            const BSCtoDC = "0x12d8294c";
            if (data.toLowerCase().startsWith(BSCtoDC.toLowerCase()))
            {
                const [amount, requestor, id] = ethers.utils.defaultAbiCoder.decode(["uint256", "address", "uint256"], ethers.utils.hexDataSlice(data, 4));

                const bridgeCompleteData: BSCtoDCCallData = {
                    bridgeTxHash: tx.hash,
                    id: id.toNumber(),
                    amountRecieved: amount,
                    recieverAddr: requestor
                }

                this.knownBridgeCalls[tx.hash] = bridgeCompleteData;

                this.onNewBridgedogeBSCtoDCCall.next(bridgeCompleteData);
            }
        });
    }

    public async findBSCtoDCForBridgeId(bridgeId: number): Promise<BSCtoDCCallData | undefined> {
        for (let hash in this.knownBridgeCalls) {
            if (this.knownBridgeCalls[hash].id == bridgeId) {
                return this.knownBridgeCalls[hash];
            }
        }

        const blockNumber = await this.getBlockNumber();
        const toBlock = blockNumber;

        const url = `${this.API_URL}/api?module=account&action=txlist&address=${BRIDGEDOGE_DC_ADDRESS}&endBlock=${toBlock}`;
        const d = await ethers.utils.fetchJson(url);
        const logs = d.result;

        let foundData: BSCtoDCCallData | undefined = undefined;

        for (let i=0; i<logs.length; i++) {
            let log = logs[i];

            let data: string = log.input;

            const BSCtoDC = "0x12d8294c";
            if (data.toLowerCase().startsWith(BSCtoDC.toLowerCase()))
            {
                const [amount, requestor, id] = ethers.utils.defaultAbiCoder.decode(["uint256", "address", "uint256"], ethers.utils.hexDataSlice(data, 4));

                const bridgeCompleteData: BSCtoDCCallData = {
                    bridgeTxHash: log.hash,
                    id: id.toNumber(),
                    amountRecieved: amount,
                    recieverAddr: requestor
                }

                if (bridgeCompleteData.id == bridgeId) {
                    foundData = bridgeCompleteData;
                    this.knownBridgeCalls[log.hash] = bridgeCompleteData;
                    break;
                }
            }
        }

        return foundData;
    }

    public async findOraclePayoutTxForBSCTxHash(bscTxHash: string): Promise<string | undefined> {
        const blockNumber = await this.getBlockNumber();
        const toBlock = blockNumber;

        const url = `${this.API_URL}/api?module=account&action=txlist&address=${oracleWallet.address}&endBlock=${toBlock}`;
        const d = await ethers.utils.fetchJson(url);
        const logs = d.result;

        for (let i=0; i<logs.length; i++) {
            let log = logs[i];

            try {
                const [txhash, amountWDOGE, reciever] = ethers.utils.defaultAbiCoder.decode(["bytes32", "uint256", "address"], ethers.utils.hexDataSlice(log.input, 4));
                if (txhash.toLowerCase() == bscTxHash.toLowerCase()) {
                    return log.hash;
                }
            } catch (e) {

            }
        }

    }  
}




