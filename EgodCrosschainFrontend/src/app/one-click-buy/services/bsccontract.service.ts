import { ChangeDetectorRef, Injectable } from '@angular/core';
import { WinRefService } from '../../win-ref.service';
import MultichainABI from "../multichain-abi.json";
import { ethers } from "ethers";
import { Subject } from 'rxjs';
import EgodXCR from "../../../../../Hardhat/deployments/dogechain/EgodXCReciever.json";
import EgodXCSender from "../../../../../Hardhat/deployments/bsc/EgodXCSender.json";


export const BSC_CHAIN_ID = 56;
export const DOGECHAIN_CHAIN_ID = 2000;
export const EGOD_XCRECIEVER_ADDRESS = EgodXCR.address;
export const EGOD_XCSENDER_ADDRESS = EgodXCSender.address;

export type Message = {
  message: string;
  error: boolean;
  tx?: string;
}


@Injectable({
  providedIn: 'root'
})
export class BSCContractService {

  private chainId: Number = BSC_CHAIN_ID;
  private connecting: boolean = false;
  public hasMetamask: boolean = false;
  public onConnected: Subject<void> = new Subject<void>();
  public onAccountChanged: Subject<void> = new Subject<void>();
  private provider!: ethers.providers.Web3Provider;
  public connectedAccountAddress?: string;
  public txInProgress: boolean = false;
  public onMessage: Subject<Message> = new Subject<Message>();

  constructor(private winRef: WinRefService) {
  }

  public async connect()
  {
    if (!this.winRef.window.ethereum) {
      console.log("No wallet provider found!");
      this.hasMetamask = false;
      return;
    } else {
      this.hasMetamask = true;
    }

    if (this.connecting) return;
    this.connecting = true;

    await this.winRef.window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{
            chainId: "0x" + this.chainId.toString(16)
        }]
    }).then((result: any) => {
        return true;
    }).catch((error: any) => {
        return false;
    });

    this.connecting = false;

    await this.load_connection();

    this.onConnected.next();
  }

  private async load_connection()
  {
    console.log("Connecting...");
      if (this.winRef.window.ethereum) {
          await this.winRef.window.ethereum.send("eth_requestAccounts", []);
          this.provider = new ethers.providers.Web3Provider(this.winRef.window.ethereum);
          console.log("Connected to web3 provider");
      } else if (this.winRef.window.web3) {
          this.provider = new ethers.providers.Web3Provider(this.winRef.window.web3.currentProvider);
      } else {
          console.log("No web3 provider found :(");
          return;
      }
  
      await this.provider.send("eth_requestAccounts", []);

      this.connectedAccountAddress = await this.provider.getSigner().getAddress();
      await this.loadContracts();

      this.winRef.window.ethereum.on("accountsChanged", async () => {
          this.connectedAccountAddress = await this.provider.getSigner().getAddress();
          await this.loadContracts();
          this.onAccountChanged.next();
      });
  }

  public egodXCSenderContract!: ethers.Contract;

  private async loadContracts() {
    this.egodXCSenderContract = await new ethers.Contract(EgodXCSender.address, EgodXCSender.abi, this.provider.getSigner());
  }

  public async checkEnabled() {
    return await this.egodXCSenderContract.allEnabled();
  }

  public async doOneClickBuy(amountBNB: string, fake: boolean = false): Promise<string | undefined> {
    if (this.txInProgress) return undefined;
    this.txInProgress = true;

    if (fake) {
      // wait 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      this.txInProgress = false;
      return "0xf0598acb15de399682f06c79e50b76b71d6ba7ddf3da5b53f39e36d30e927b18";
    }

    try {
      const dogechainSAVIOR = "0xBfbb7B1d22FF521a541170cAFE0C9A7F20d09c3B";
      const value = ethers.utils.parseEther(amountBNB);

      console.log("Sending", value.toString(), "BNB to", EGOD_XCRECIEVER_ADDRESS);

      let tx = await this.egodXCSenderContract.doOneClickBuy(dogechainSAVIOR, {value: value});

      let rx = await tx.wait();

      this.txInProgress = false;

      return rx.transactionHash;
    } finally {
      this.txInProgress = false;
    }
  }
}
