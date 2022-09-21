import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { BigNumber, ethers } from 'ethers';
import { fetchJson } from 'ethers/lib/utils';
import { ErrorMessageService } from '../error-message-renderer/error-message.service';
import { BSCContractService, EGOD_XCRECIEVER_ADDRESS, EGOD_XCSENDER_ADDRESS } from './services/bsccontract.service';
import { BSCTransactionFinderService, HistoricalTransaction } from './services/bsctransaction-finder.service';
import { JoinDogechainService } from './services/join-dogechain.service';
import { OracleService } from './services/oracle.service';

function countDecimals(value: string) { 
  return value.toString().split(".")[1].length;  
};

export type Step = "CONNECT_WALLET" | "BUY" | "CONNECT_DOGECHAIN" | "WAIT_FOR_ORACLE" | "FINISHED";

@Component({
  selector: 'app-one-click-buy',
  templateUrl: './one-click-buy.component.html',
  styleUrls: ['./one-click-buy.component.scss']
})
export class OneClickBuyComponent implements OnInit {

  public currentStep: Step = "CONNECT_DOGECHAIN";
  @ViewChild("amountBNB") bnbAmountInput!: ElementRef;
  public transactionHistory?: HistoricalTransaction[];

  public amountInBNB: string = "0.1";
  public validAmount: boolean = true;
  public amountOutSavior: BigNumber = BigNumber.from("0");

  public buyTransactionHash?: string;

  public error?: string;

  constructor(
    public bscContract: BSCContractService,
    public transactionFinder: BSCTransactionFinderService,
    private cdr: ChangeDetectorRef,
    public joinDogechain: JoinDogechainService,
    public oracle: OracleService,
    public errorService: ErrorMessageService) { }

  async ngOnInit() {
    if (this.bscContract.connectedAccountAddress) {
      this.transactionHistory = await this.transactionFinder.findTransactions(this.bscContract.connectedAccountAddress);
      console.log(this.transactionHistory);
    }

    this.bscContract.onAccountChanged.subscribe(() => {
      this.cdr.detectChanges();
    })

    this.activateStep("CONNECT_WALLET");
  }

  private async activateStep(step: Step) {
    this.currentStep = step;
    if (this.currentStep == "CONNECT_WALLET") {
      this.ShowBSCActivity = false;
      this.ShowDogechainActivity = false;
      this.connectWallet();
    } else if (this.currentStep == "BUY") {
      this.ShowBSCActivity = false;
      this.ShowDogechainActivity = false;
    } else if (this.currentStep == "CONNECT_DOGECHAIN") {
      this.ShowBSCActivity = true;
      this.ShowDogechainActivity = true;
      this.connectDogechain();
    } else if (this.currentStep == "WAIT_FOR_ORACLE") {
      this.ShowBSCActivity = true;
      this.ShowDogechainActivity = true;
      this.waitForOracle();
    } else if (this.currentStep == "FINISHED") {
      this.ShowBSCActivity = false;
      this.ShowDogechainActivity = false;
    }
  }

  public async connectWallet() {
    await this.bscContract.connect();
    this.activateStep("BUY");

    this.updateTransmuterEnabled();
  }

  public async connectDogechain() {
    await this.joinDogechain.joinDogechain(false);
    this.activateStep("WAIT_FOR_ORACLE");
  }

  public async waitForOracle() {
    try {
      this.oracleTransactionHash = await this.oracle.waitForOracle(this.buyTransactionHash!);
    } catch (e) {
      console.error("Oracle error:", e);
      this.error = "Oracle error: " + e;
      return;
    }


    this.activateStep("FINISHED");
  }

  public async buy() {
    this.ShowBSCActivity = true;
    try {
      this.buyTransactionHash = await this.bscContract.doOneClickBuy(this.amountInBNB, false);
    } catch (e: any) {
      if (e.data) {
        this.errorService.SetMessage(`Error buying: ${e.data.message}`);
      } else {
        this.errorService.SetMessage(`Error buying: ${e}`);
      }
      this.ShowBSCActivity = false;
    }

    if (this.buyTransactionHash) {
      this.activateStep("CONNECT_DOGECHAIN");
    }
  }

  public validate_txhash(addr: string) {
    return addr.length == 66 && addr.startsWith("0x");
    // return /^0x([A-Fa-f0-9]{64})$/.test(addr);
  }

  public async checkTransaction(txhash: string) {
    this.currentStep = "WAIT_FOR_ORACLE";
    this.ShowBSCActivity = true;
    this.ShowDogechainActivity = true;
    if (!this.validate_txhash(txhash)) {
      console.error("Invalid txhash");
      this.errorService.SetMessage("Invalid txhash");
      this.currentStep = "BUY";
      this.ShowBSCActivity = false;
      this.ShowDogechainActivity = false;
      return;
    }
    this.buyTransactionHash = txhash;
    const startedProcessing = await this.oracle.pokeTheOracle(this.buyTransactionHash);
    if (startedProcessing) {
      this.activateStep("WAIT_FOR_ORACLE");
    } else {
      console.error("Failed to poke oracle for", txhash);
      this.errorService.SetMessage("Failed to check transaction status, are you sure this is a valid BSC transaction hash?");
      this.currentStep = "BUY";
      this.ShowBSCActivity = false;
      this.ShowDogechainActivity = false;
      this.buyTransactionHash = undefined;
    }
  }

  public formatAmount(amount: ethers.BigNumber): string {
    return ethers.utils.formatUnits(amount, 18);
  }

  public updateQuote() {
    this.amountInBNB = this.bnbAmountInput.nativeElement.value;
    this.validAmount = parseFloat(this.amountInBNB) >= 0.1;
  }

  public get EgodXCSenderAddress(): string {
    return EGOD_XCSENDER_ADDRESS;
  }

  public get EgodXCRecieverAddress(): string {
    return EGOD_XCRECIEVER_ADDRESS;
  }

  public shortAddress(address: string): string {
    return address.substr(0, 6) + "..." + address.substr(address.length - 4, 4);
  }

  public get WaitingForBSCTx(): boolean {
    return this.bscContract.txInProgress;
  }

  public get WaitingForOracle(): boolean {
    return this.buyTransactionHash != undefined && !this.oracleTransactionHash;
  }

  public oracleTransactionHash?: string;
  public ShowBSCActivity: boolean = false;
  public ShowDogechainActivity: boolean = false;

  public get ShowZoomer(): boolean {
    return this.ShowBSCActivity || this.ShowDogechainActivity;
  }

  public skipConnect() {
    this.activateStep("WAIT_FOR_ORACLE");
  }

  public isTransmuterEnabled: boolean = true;
  
  public async updateTransmuterEnabled() {
    this.isTransmuterEnabled = await this.bscContract.checkEnabled();
  }

  public async startAgain() {
    delete this.buyTransactionHash;
    delete this.oracleTransactionHash;
    this.activateStep("BUY");
  }

  public showAdvanced = false;
  public advanced() {
    this.showAdvanced = true;
  }
}
