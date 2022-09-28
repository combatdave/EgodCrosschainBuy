import {BigNumber, ethers} from "ethers";
import { Subject } from "rxjs";
import { egodXCRecieverInterface, oracleWallet } from "../connections";

export const BRIDGEDOGE_DC_ADDRESS = "0xB49D69115DBFe69F86f897c7a340A4d5f68f3B0c";

// const API_URL = "https://explorer.dogmoney.money";
const API_URL = "https://explorer.dogechain.dog"; 

export type BSCtoDCCallData = {
    brdigeTxHash: string;
    id: number;
    amountRecieved: BigNumber;
    recieverAddr: string;
}

export class Bridgedoge_DogeChain {
    
    private knownBridgeCalls: {[txhash: string]: BSCtoDCCallData} = {};

    public onNewBridgedogeBSCtoDCCall: Subject<BSCtoDCCallData> = new Subject<BSCtoDCCallData>();

    constructor() {
    }

    public async watch() {
        try {
            this.pollWeb();
        } catch (e) {
            console.error("BridgeDogeWatcher error polling web:", e);
        }
        setInterval(() => {this.pollWeb()}, 10000);
    };  

    private async getBlockNumber() {
        const getBlockNumberURL = API_URL + "/api?module=block&action=eth_block_number";
        const d = await ethers.utils.fetchJson(getBlockNumberURL);
        return parseInt(d.result, 16);
    }

    private async pollWeb() {
        const blockNumber = await this.getBlockNumber();

        const toBlock = blockNumber;

        const url = `${API_URL}/api?module=account&action=txlist&address=${BRIDGEDOGE_DC_ADDRESS}&endBlock=${toBlock}`;
        const d = await ethers.utils.fetchJson(url);
        const logs = d.result;

        logs.forEach((log: any) => {
            let data: string = log.input;

            if (log.hash in this.knownBridgeCalls) {
                return;
            }

            const BSCtoDC = "0x12d8294c";
            if (data.toLowerCase().startsWith(BSCtoDC.toLowerCase()))
            {
                const [amount, requestor, id] = ethers.utils.defaultAbiCoder.decode(["uint256", "address", "uint256"], ethers.utils.hexDataSlice(data, 4));

                const bridgeCompleteData: BSCtoDCCallData = {
                    brdigeTxHash: log.hash,
                    id: id.toNumber(),
                    amountRecieved: amount,
                    recieverAddr: requestor
                }

                this.knownBridgeCalls[log.hash] = bridgeCompleteData;

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

        const url = `${API_URL}/api?module=account&action=txlist&address=${BRIDGEDOGE_DC_ADDRESS}&endBlock=${toBlock}`;
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
                    brdigeTxHash: log.hash,
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

        const url = `${API_URL}/api?module=account&action=txlist&address=${oracleWallet.address}&endBlock=${toBlock}`;
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




