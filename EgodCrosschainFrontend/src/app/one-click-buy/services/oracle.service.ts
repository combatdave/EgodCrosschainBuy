import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

const ORACLE_URL = environment.oracleURL; //"https://egod-crosschain-oracle.herokuapp.com/"

@Injectable({
  providedIn: 'root'
})
export class OracleService {

  public bscTxHash?: string;
  public status?: string;
  public oracleTxHash?: any;

  public onStatusChanged: Subject<void> = new Subject<void>();

  private sleepTime: number = 1000;

  constructor() {
    console.log("Oracle URL:", ORACLE_URL);
  }

  public async pokeTheOracle(bsctx: string): Promise<boolean> {
    const url = "/processtx?txhash=" + bsctx;
    const fullURL = new URL(url, ORACLE_URL);
    const response = await fetch(fullURL, { method: "POST" });
    const json = await response.json();
    if (json.status == "error") {
      return false;
    }
    return true;
  }

  public async waitForOracle(bsctx: string): Promise<string | undefined> {
    this.bscTxHash = bsctx;
    this.status = "unknown";
    await this.waitForCompletionData();
    return this.oracleTxHash;
  }

  private async waitForCompletionData() {
    this.sleepTime = 1000;
    while (true) {
      const url = "/txstatus?txhash=" + this.bscTxHash;
      const fullURL = new URL(url, ORACLE_URL);
      console.log("Fetching " + fullURL);
      const response = await fetch(fullURL);
      const json = await response.json();
      console.log(json);

      if (json.status == "pending") {
        this.status = "pending";
        this.onStatusChanged.next();
      } else if (json.status == "complete") {
        this.status = "complete";
        this.oracleTxHash = json.oracleTxHash;
        this.onStatusChanged.next();
        return;
      }

      await new Promise(r => setTimeout(r, this.sleepTime));
      this.sleepTime = Math.min(this.sleepTime * 1.1, 10000);
    }
  }
}
