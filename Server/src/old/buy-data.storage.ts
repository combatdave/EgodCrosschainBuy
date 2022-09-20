import { BigNumber } from "ethers";
import fs from "fs";
// import { EgodCrossChainBuyData } from "./oracle";

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

type SerializedBuyData = {
    hash: string;
    buyer: string;
    amountSent: string;
    dcTokenToBuy: string;
    recieverContractAddress: string;
    timestamp: number;
    dogechainTxHash?: string;
}


export class BuyDataStorage {
    private _pendingBuys: EgodCrossChainBuyData[] = [];

    constructor(public filename: string) {
        this.load();
    }

    public get data(): EgodCrossChainBuyData[] {
        return this._pendingBuys;
    }

    public add(pendingBuy: EgodCrossChainBuyData) {
        this._pendingBuys.push(pendingBuy);
        this.save();
    }

    public remove(pendingBuy: EgodCrossChainBuyData) {
        if (this._pendingBuys.includes(pendingBuy)) {
            this._pendingBuys.splice(this._pendingBuys.indexOf(pendingBuy), 1);
            this.save();
        }
    }

    private load() {
        function deserialize(serializedPendingBuys: SerializedBuyData[]): EgodCrossChainBuyData[] {
            return serializedPendingBuys.map((buy) => {
                return {
                    hash: buy.hash,
                    buyer: buy.buyer,
                    amountSent: BigNumber.from(buy.amountSent),
                    dcTokenToBuy: buy.dcTokenToBuy,
                    recieverContractAddress: buy.recieverContractAddress,
                    timestamp: new Date(buy.timestamp),
                    dogechainTxHash: buy.dogechainTxHash
                }
            });
        }

        if (fs.existsSync(this.filename)) {
            const trackedFiledContents = fs.readFileSync(this.filename, "utf8");
            const serializedPendingBuys = JSON.parse(trackedFiledContents);
            this._pendingBuys = deserialize(serializedPendingBuys);
            console.log("ℹ️  Loaded", Object.keys(this._pendingBuys).length, "buys from", this.filename);
        }
    }

    private save() {
        function serialize(pendingBuy: EgodCrossChainBuyData): SerializedBuyData {
            return {
                hash: pendingBuy.hash,
                buyer: pendingBuy.buyer,
                amountSent: pendingBuy.amountSent.toString(),
                dcTokenToBuy: pendingBuy.dcTokenToBuy,
                recieverContractAddress: pendingBuy.recieverContractAddress,
                timestamp: pendingBuy.timestamp.getTime(),
                dogechainTxHash: pendingBuy.dogechainTxHash
            }
        }

        const serializedPendingBuys = this._pendingBuys.map((buy) => serialize(buy));
        fs.writeFileSync(this.filename, JSON.stringify(serializedPendingBuys));
    }
}