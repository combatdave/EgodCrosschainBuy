import {BigNumber, ethers} from "ethers";
import { Subject } from "rxjs";
import { egodXCRecieverInterface, oracleWallet } from "../connections";
import SynapseABI from "./synapse_abi.json";

export const SYNAPSE_DC_ADDRESS = "0x9508bf380c1e6f751d97604732ef1bae6673f299";

const API_URLS = [
    "https://explorer.dogechain.dog",
    "https://explorer.dogmoney.money"
];


export type MintCallData = {
    bridgeTxHash: string;
    kappa: string;
    amountRecievedBUSD: BigNumber;
    recieverAddr: string;
    tokenAddr: string;
}

export class Synapse_DogeChain {
    
    private API_INDEX: number = 0;
    private knownBridgeCalls: {[txhash: string]: MintCallData} = {};
    public onNewSynapseMint: Subject<MintCallData> = new Subject<MintCallData>();

    constructor(private recieverAddress) {
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
        const url = `${this.API_URL}/api?module=account&action=txlist&address=${SYNAPSE_DC_ADDRESS}&endBlock=${toBlock}`;
        const d = await ethers.utils.fetchJson(url);
        const txList = d.result as any[];
        return txList;
    }

    private parseTransaction(data: string) {
        try {
            const synapseInterface = new ethers.utils.Interface(SynapseABI);
            const txDescription = synapseInterface.parseTransaction({data: data});
            return txDescription;
        } catch {
            return undefined
        }
    }

    private async pollWeb() {
        let txList;
        try {
            txList = await this.fetchTxList();
        } catch (e) {
            console.error("Failed to fetch TX list:", e);
            return;
        }

        txList.forEach((tx: any) => {
            if (tx.hash in this.knownBridgeCalls) {
                return;
            }

            const parsedTx = this.parseTransaction(tx.input);
            const confirmations = parseInt(tx.confirmations);
            const isError = parseInt(tx.isError) != 0;

            if (parsedTx && parsedTx.name == "mint" && !isError && confirmations > 1) {
                const amountBUSD = parsedTx.args.amount;
                const feeBUSD = parsedTx.args.fee;
                const recievedBUSD = amountBUSD.sub(feeBUSD);

                const bridgeCompleteData: MintCallData = {
                    bridgeTxHash: tx.hash,
                    amountRecievedBUSD: recievedBUSD,
                    recieverAddr: parsedTx.args.to,
                    kappa: parsedTx.args.kappa,
                    tokenAddr: parsedTx.args.token
                }

                if (bridgeCompleteData.recieverAddr.toLowerCase() == this.recieverAddress.toLowerCase()) {
                    this.knownBridgeCalls[tx.hash] = bridgeCompleteData;
                    this.onNewSynapseMint.next(bridgeCompleteData);
                }
            }
        });
    }

    public async findMintForKappa(kappa: string): Promise<MintCallData | undefined> {
        for (let hash in this.knownBridgeCalls) {
            if (this.knownBridgeCalls[hash].kappa == kappa) {
                return this.knownBridgeCalls[hash];
            }
        }

        await this.pollWeb();

        for (let hash in this.knownBridgeCalls) {
            if (this.knownBridgeCalls[hash].kappa == kappa) {
                return this.knownBridgeCalls[hash];
            }
        }
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
                const [txhash, amountBUSD, reciever] = ethers.utils.defaultAbiCoder.decode(["bytes32", "uint256", "address"], ethers.utils.hexDataSlice(log.input, 4));
                if (txhash.toLowerCase() == bscTxHash.toLowerCase()) {
                    return log.hash;
                }
            } catch (e) {

            }
        }

    }  
}




