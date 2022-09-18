import { BigNumber, ethers } from "ethers";
import { EgodCrossChainBuyData, BSCEgodXCSenderWatcher } from "./bsc-updates";
import { BuyDataStorage } from "./buy-data.storage";
import { contract_egodXCSender_bsc, DC_SAVIOR_ADDR, getDogechainRecieverContract, oracleWallet } from "./connections";
import { BridgeDogeWatcher, BridgeDogeInData, DOGEBRIDGE_DC_ADDRESS } from "./dogechain-updates";
import { Logger } from "./logs";


export class Oracle {
    public pendingBuys: BuyDataStorage = new BuyDataStorage("tracked-transactions.json");
    public completedBuys: BuyDataStorage = new BuyDataStorage("completed-transactions.json");

    constructor() {
    }

    public async listen(senderWatcher: BSCEgodXCSenderWatcher, recieverWatcher: BridgeDogeWatcher) {
        senderWatcher.onNewCrossChainBuyData.subscribe(async (anySwapOutData: EgodCrossChainBuyData) => {
            this.processBridgeOutData(anySwapOutData);
        });

        recieverWatcher.onDogechainBridgeIn.subscribe(async (anySwapInData: BridgeDogeInData) => {
            this.processBridgeInData(anySwapInData);
        });

        let saviorRecieverAddress = await this.getRecieverForDogechainToken(DC_SAVIOR_ADDR)
        console.log("EgodXCSender (BSC) @", contract_egodXCSender_bsc.address);
        console.log("BridgeDoge (Dogechain) @", DOGEBRIDGE_DC_ADDRESS);
        console.log("EgodXCReciever:$SAVIOR (Dogechain) @", saviorRecieverAddress);
    }

    public getPendingTxData(hash: string): EgodCrossChainBuyData | undefined {
        for (let i=0; i<this.pendingBuys.data.length; i++) {
            if (this.pendingBuys.data[i].hash == hash) {
                return this.pendingBuys.data[i];
            }
        }
        return undefined;
    }

    public getCompletedBuyData(hash: string): EgodCrossChainBuyData | undefined {
        const data: EgodCrossChainBuyData | undefined = this.completedBuys.data.find((buy) => buy.hash.toLowerCase() == hash.toLowerCase());
        return data;
    }

    private async processBridgeOutData(data: EgodCrossChainBuyData) {
        const hash = data.hash;
        const alreadyTracked = this.pendingBuys.data.find((buy) => buy.hash.toLowerCase() == hash.toLowerCase());
        if (alreadyTracked) return;

        console.log("✨ Processing CrossChainBuyData:");
        console.log("✨   Hash:", data.hash);
        console.log("✨   Buyer:", data.buyer);
        console.log("✨   Amount sent:", data.amountSent.toString());
        console.log("✨   DogeChain token:", data.dcTokenToBuy);
        this.trackPendingBuy(data);
    }
    
    private async processBridgeInData(bridgeInData: BridgeDogeInData) {
        for (let i=0; i<this.pendingBuys.data.length; i++) {
            const buyData = this.pendingBuys.data[i];
    
            if (buyData.processing) continue;

            if (bridgeInData.amountRecieved.eq(buyData.amountSent.mul("10000000000"))) {
                await this.handleMatch(buyData, bridgeInData);
                return;
            }
        }
    }

    private async handleMatch(buyData: EgodCrossChainBuyData, bridgeInData: BridgeDogeInData) {
        const alreadyProcessed = await this.checkProcessedStatus(buyData);
        if (alreadyProcessed) {
            console.log("✨ BridgeIn already processed:", buyData.hash);
            this.finishPendingBuy(buyData);
            return;
        }

        buyData.processing = true;
        console.log("✨ BridgeIn matched pending buy!:");
        console.log("✨   Hash: ", buyData.hash);
        console.log("✨   Buyer: ", buyData.buyer);
        console.log("✨   Amount recieved: ", bridgeInData.amountRecieved.toString());

        const dcHash = await this.pushDataToXCReciever(buyData, bridgeInData);
        buyData.dogechainTxHash = dcHash;

        this.finishPendingBuy(buyData);
    }

    private trackPendingBuy(data: EgodCrossChainBuyData) {
        this.pendingBuys.add(data);
    }

    private finishPendingBuy(data: EgodCrossChainBuyData) {
        this.pendingBuys.remove(data);
        this.completedBuys.add(data);
    }

    private async pushDataToXCReciever(buyData: EgodCrossChainBuyData, bridgeInData: BridgeDogeInData): Promise<string | undefined> {
        console.log("↘️  Oracle pushing data to EgodXCR:", buyData.hash, bridgeInData.amountRecieved.toString(), buyData.buyer);
        Logger.Log({message: "↘️  Oracle pushing data to EgodXCR:", outTxHash: buyData.hash, amountRecieved: bridgeInData.amountRecieved.toString(), from: buyData.buyer});
        try {
            const contract = getDogechainRecieverContract(buyData.recieverContractAddress);
            let tx = await contract.connect(oracleWallet).processBuy(buyData.hash, bridgeInData.amountRecieved, buyData.buyer) as ethers.ContractTransaction;
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

    public async checkProcessedStatus(data: EgodCrossChainBuyData): Promise<boolean> {
        const contract = getDogechainRecieverContract(data.recieverContractAddress);
        const processed = await contract.isProcessed(data.hash);
        return processed;
    }

    public async getRecieverForDogechainToken(tokenAddress: string): Promise<string>{
        const recieverAddress = await contract_egodXCSender_bsc.getRecieverForDCTokenAddress(tokenAddress);
        return recieverAddress;
    }

    public async isReciever(address: string): Promise<boolean> {
        const recievers = await contract_egodXCSender_bsc.getRecievers() as string[];
        return recievers.includes(address);
    }
}