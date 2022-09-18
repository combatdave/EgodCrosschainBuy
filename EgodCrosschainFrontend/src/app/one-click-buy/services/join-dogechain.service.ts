import { Injectable } from '@angular/core';
import { WinRefService } from 'src/app/win-ref.service';
import { DOGECHAIN_CHAIN_ID } from './bsccontract.service';

@Injectable({
  providedIn: 'root'
})
export class JoinDogechainService {

  public chainId = DOGECHAIN_CHAIN_ID;

  public joinedDogechain: boolean = false;
  public addedSavior: boolean = false;

  constructor(private winRef: WinRefService) {
  }

  public async joinDogechain(fake: boolean = false) {
    if (fake) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      this.joinedDogechain = true;
      await new Promise(resolve => setTimeout(resolve, 4000));
      this.addedSavior = true;
      return;
    }

    try {
      await this.winRef.window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{
            chainId: "0x" + this.chainId.toString(16)
        }]
      });
      this.joinedDogechain = true;
    } catch (error: any) {
      if (error.code == 4902) {
        await this.addDogeChain();
      }
    }

    // wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    await this.addSAVIOR();
  }

  private async addDogeChain(){
    try {
      await this.winRef.window.ethereum.request({ method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: "0x" + this.chainId.toString(16),
            chainName: "DogeChain",
            nativeCurrency: {
              name: "wDOGE",
              symbol: "wDOGE",
              decimals: 18 //In number form
            },
            rpcUrls: ["https://dogechain.ankr.com"],
            blockExplorerUrls: ["https://explorer.dogechain.dog"]
          }
        ]
      });
    } catch (error: any) {
      console.error(error);
    }
    this.joinedDogechain = true;
  }

  public async addSAVIOR() {
    try {
      const wasAdded = await this.winRef.window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: "0xBfbb7B1d22FF521a541170cAFE0C9A7F20d09c3B",
            symbol: "$SAVIOR",
            decimals: 0
          },
        },
      });
    } catch (error: any) {
      console.error(error);
    }
    this.addedSavior = true;
  }
}
