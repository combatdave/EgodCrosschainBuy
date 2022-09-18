import {BigNumber, Contract, ethers} from "ethers";
import { Subject } from "rxjs";
import { Oracle } from "./oracle";
// import { contract_egodXCReciever_dogechain } from "./connections";

export const DOGEBRIDGE_DC_ADDRESS = "0xB450211dA1FDa2ca2CbB794eB0b18eF7A7c337Fc";

// const API_URL = "https://explorer.dogmoney.money";
const API_URL = "https://explorer.dogechain.dog"; 

export type BridgeDogeInData = {
    hash: string,
    amountRecieved: BigNumber,
    recieverAddr: string;
}

export class BridgeDogeWatcher {

    public onDogechainBridgeIn: Subject<BridgeDogeInData> = new Subject<BridgeDogeInData>();

    constructor(public oracle: Oracle) {
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

            const BSCtoDC = "0x91b8cdce";
            if (data.toLowerCase().startsWith(BSCtoDC.toLowerCase()))
            {
                const [amount, requestor] = ethers.utils.defaultAbiCoder.decode(["uint256", "address"], ethers.utils.hexDataSlice(data, 4));
                
                // TODO: Need to check if requestor is an EgodXCReciever contract
                const requestorIsEgodXCReciever = await this.oracle.isReciever(requestor);
                if (requestorIsEgodXCReciever) {
                    const bridgeInData: BridgeDogeInData = {
                        hash: log.hash,
                        amountRecieved: amount,
                        recieverAddr: requestor
                    };
                    
                    this.onDogechainBridgeIn.next(bridgeInData);
                }
            }
        });
    }  
}




