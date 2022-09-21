import {BigNumber, ethers} from "ethers";
import { Subject } from "rxjs";

export const DOGEBRIDGE_DC_ADDRESS = "0xB49D69115DBFe69F86f897c7a340A4d5f68f3B0c";

// const API_URL = "https://explorer.dogmoney.money";
const API_URL = "https://explorer.dogechain.dog"; 

export type BSCtoDCCallData = {
    id: number,
    amountRecieved: BigNumber,
    recieverAddr: string;
}

export class Bridgedoge_DogeChain {
    
    public onBridgedogeBSCtoDCCall: Subject<BSCtoDCCallData> = new Subject<BSCtoDCCallData>();

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

        const url = `${API_URL}/api?module=account&action=txlist&address=${DOGEBRIDGE_DC_ADDRESS}&endBlock=${toBlock}`;
        const d = await ethers.utils.fetchJson(url);
        const logs = d.result;

        logs.forEach(async (log: any) => {
            let data: string = log.input;

            const BSCtoDC = "0x12d8294c";
            if (data.toLowerCase().startsWith(BSCtoDC.toLowerCase()))
            {
                const [amount, requestor, id] = ethers.utils.defaultAbiCoder.decode(["uint256", "address", "uint256"], ethers.utils.hexDataSlice(data, 4));

                const bridgeCompleteData: BSCtoDCCallData = {
                    id: id.toNumber(),
                    amountRecieved: amount,
                    recieverAddr: requestor
                }
                this.onBridgedogeBSCtoDCCall.next(bridgeCompleteData);
            }
        });
    }

    public async findBSCtoDCForBridgeId(bridgeId: number): Promise<BSCtoDCCallData | undefined> {
        const blockNumber = await this.getBlockNumber();

        const toBlock = blockNumber;

        const url = `${API_URL}/api?module=account&action=txlist&address=${DOGEBRIDGE_DC_ADDRESS}&endBlock=${toBlock}`;
        const d = await ethers.utils.fetchJson(url);
        const logs = d.result;

        logs.forEach(async (log: any) => {
            let data: string = log.input;

            const BSCtoDC = "0x12d8294c";
            if (data.toLowerCase().startsWith(BSCtoDC.toLowerCase()))
            {
                const [amount, requestor, id] = ethers.utils.defaultAbiCoder.decode(["uint256", "address", "uint256"], ethers.utils.hexDataSlice(data, 4));

                const bridgeCompleteData: BSCtoDCCallData = {
                    id: id.toNumber(),
                    amountRecieved: amount,
                    recieverAddr: requestor
                }
                if (bridgeCompleteData.id == bridgeId) {
                    return bridgeCompleteData;
                }
            }
        });

        return undefined;
    }  
}




