import { ethers } from "ethers";
import { Transmuter_Base, EgodCrossChainBuy, PayoutData } from "../bridge";
import { BUSD_Reciever_Deployment, contract_egodXCSender_bsc, senderAddress as GetSenderAddress } from "../connections";
import { SynapseBSCWatcher } from "./synapse-bsc";
import { MintCallData, Synapse_DogeChain } from "./synapse-dogechain";

const DOGECHAIN_BUSD_ADDR = "0x1555C68Be3b22cdcCa934Ae88Cb929Db40aB311d";

export class Synapse extends Transmuter_Base {

    private bscWatcher: SynapseBSCWatcher;
    private dogechainWatcher: Synapse_DogeChain;
    private recieverAddress: string = "";

    constructor(public provider_src: ethers.providers.JsonRpcProvider, public provider_dogechain: ethers.providers.JsonRpcProvider) {
        super(provider_src, provider_dogechain);
        this.init();
    }

    private async init() {
        await this.loadRecieverAddress();
        this.dogechainWatcher = new Synapse_DogeChain(this.recieverAddress);
        this.bscWatcher = new SynapseBSCWatcher(GetSenderAddress());

        console.log("ℹ️  ====== Synapse Ready ======");
        console.log("ℹ️  Sender address:", this.bscWatcher.senderAddress);
        console.log("ℹ️  Reciever address:", this.recieverAddress);

        this.dogechainWatcher.onNewSynapseMint.subscribe(async (data: MintCallData) => {
            if (this.isRelevantData(data)) {
                console.log("ℹ️  New Synapse::Mint to EgodXCReciever(BUSD):", data.kappa);
                const egodEvent = await this.findEgodCrossChainBuyEvent(data.kappa);
                if (egodEvent) {
                    console.log("     Synapse found EgodCrossChainBuyEvent for kappa", data.kappa, "=> oneclick buy tx:", egodEvent.txhash);
                    const payoutData: PayoutData = {
                        src_txhash: egodEvent.txhash,
                        buyer: egodEvent.buyer,
                        egodRecieverContract: data.recieverAddr,
                        DCTokenAddress: egodEvent.DCTokenAddress,
                        amount: data.amountRecievedBUSD,
                        dogechainBridgeTxHash: data.bridgeTxHash,
                        bridgedToken: "BUSD"
                    }
                    this.onNewPayoutData.next(payoutData);
                } else {
                    console.log("     No EgodCrossChainBuyEvent for Synapse kappa:", data.kappa);
                }
            }
        });

        await this.dogechainWatcher.watch();
    }

    private isRelevantData(data: MintCallData) {
        const recieverCorrect = data.recieverAddr.toLowerCase() == this.recieverAddress.toLowerCase();
        const tokenCorrect = data.tokenAddr.toLowerCase() == DOGECHAIN_BUSD_ADDR.toLowerCase();
        return recieverCorrect && tokenCorrect;
    }

    private async loadRecieverAddress() {
        this.recieverAddress = await contract_egodXCSender_bsc.dogechainRecieverAddress_BUSD();
    }

    public getRecieverContract(): ethers.Contract {
        return new ethers.Contract(this.recieverAddress, BUSD_Reciever_Deployment.abi, this.provider_dogechain);
    }

    public async findEgodCrossChainBuyEvent(id: any): Promise<EgodCrossChainBuy> {
        return this.bscWatcher.findEgodCrossChainBuyEvent(id);
    }

    public async findEgodCrossChainBuyEventFromTx(txhash: string): Promise<EgodCrossChainBuy> {
        return await this.bscWatcher.findEgodCrossChainBuyEventFromTx(txhash);
    }

    public async findOraclePayoutTxForBSCTxHash(bscTxHash: string): Promise<string> {
        return await this.dogechainWatcher.findOraclePayoutTxForBSCTxHash(bscTxHash);
    }

    public async manualProcessBSCTransaction(txhash: string): Promise<boolean> {
        console.log("ℹ️  Synapse manualProcessBSCTransaction for Synapse:", txhash);
        let success = false;
        const egodEvent = await this.findEgodCrossChainBuyEventFromTx(txhash);
        if (egodEvent && egodEvent.bridgeId) {
            const bscToDCData = await this.dogechainWatcher.findMintForKappa(egodEvent.bridgeId);
            if (bscToDCData) {
                const payoutData: PayoutData = {
                    src_txhash: egodEvent.txhash,
                    buyer: egodEvent.buyer,
                    egodRecieverContract: bscToDCData.recieverAddr,
                    DCTokenAddress: egodEvent.DCTokenAddress,
                    amount: bscToDCData.amountRecievedBUSD,
                    dogechainBridgeTxHash: bscToDCData.bridgeTxHash,
                    bridgedToken: "BUSD"
                }

                this.onNewPayoutData.next(payoutData);

                success = true;
            }
        }
        return success;
    }
}