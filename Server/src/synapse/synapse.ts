import { ethers } from "ethers";
import { SynapseMintCallData, Synapse_DogeChain } from "./synapse-dogechain";
import { SynapseBSCWatcher } from "./synapse-bsc";
import { Transmuter_Base, EgodCrossChainBuy, PayoutData } from "../bridge";
import TransmuterSenderDeployment from "../deployments/ethereum/TransmuterSender_Synapse_WETH.json"


export class Transmuter_Synapse extends Transmuter_Base{

    private dogechainWatcher: Synapse_DogeChain = new Synapse_DogeChain();
    private recieverAddress: string = "";
    
    constructor(public provider_src: ethers.providers.JsonRpcProvider, public provider_dogechain: ethers.providers.JsonRpcProvider) {
        super(provider_src, provider_dogechain);

        this.loadRecieverAddress();

        this.dogechainWatcher.onSynapseMintCall.subscribe(async (data: SynapseMintCallData) => {
            if (this.isEgodReciever(data.recieverAddr)) {
                const egodEvent = await this.findEgodCrossChainBuyEvent(data.kappa);
                if (egodEvent) {
                    const payoutData: PayoutData = {
                        txhash: egodEvent.txhash,
                        buyer: egodEvent.buyer,
                        egodRecieverContract: data.recieverAddr,
                        DCTokenAddress: egodEvent.DCTokenAddress,
                        amount: egodEvent.amountDoge,
                        dogechainBridgeTxHash: data.synapseTxHash,
                        bridgedToken: "BUSD"
                    }

                    this.onPayoutDataAssembled.next(payoutData);
                }
            }
        });
    }

    private async loadRecieverAddress() {
        const address = TransmuterSenderDeployment.address;
        if (address == "0x0000000000000000000000000000000000000000") {
            console.error("No reciever address found in deployment file");
            return;
        }

        const abi = TransmuterSenderDeployment.abi;
        const contract = new ethers.Contract(address, abi, this.provider_src);
        this.recieverAddress = await contract.transmuterReciever_Dogechain();
    }

    protected isEgodReciever(address: string): boolean {
        return this.recieverAddress.toLowerCase() == address.toLowerCase();
    }

    public async findEgodCrossChainBuyEvent(kappa: string) : Promise<EgodCrossChainBuy | undefined>{
        return await SynapseBSCWatcher.findEgodCrossChainBuyEvent(kappa);
    }

    public async findEgodCrossChainBuyEventFromTx(txhash: string) : Promise<EgodCrossChainBuy | undefined>{
        return await SynapseBSCWatcher.findEgodCrossChainBuyEventFromTx(txhash);
    }

    public async manualProcessBSCTransaction(txhash: string): Promise<boolean> {
        console.log("Synapse manualProcessBSCTransaction:", txhash);
        let success = false;
        const egodEvent = await this.findEgodCrossChainBuyEventFromTx(txhash);
        if (egodEvent) {
            const bscToDCData = await this.dogechainWatcher.findSynapseMintForKappa(egodEvent.txhash);
            if (bscToDCData) {
                const payoutData: PayoutData = {
                    txhash: egodEvent.txhash,
                    buyer: egodEvent.buyer,
                    egodRecieverContract: bscToDCData.recieverAddr,
                    DCTokenAddress: egodEvent.DCTokenAddress,
                    amount: bscToDCData.amountRecieved,
                    dogechainBridgeTxHash: bscToDCData.synapseTxHash,
                    bridgedToken: "BUSD"
                }

                this.onPayoutDataAssembled.next(payoutData);

                success = true;
            }
        }
        return success;
    }
}