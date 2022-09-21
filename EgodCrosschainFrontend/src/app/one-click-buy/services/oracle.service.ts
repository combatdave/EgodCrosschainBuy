import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

const ORACLE_URL = "https://egod-crosschain-oracle.herokuapp.com/"

@Injectable({
  providedIn: 'root'
})
export class OracleService {

  public bscTxHash?: string;
  public status?: string;
  public completionData?: any;

  public onStatusChanged: Subject<void> = new Subject<void>();

  private sleepTime: number = 1000;

  constructor() { }

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

  public async waitForOracle(bsctx: string): Promise<string> {
    this.bscTxHash = bsctx;
    this.status = "unknown";
    const result = await this.waitForCompletionData();
    console.log(result);
    return "abc";
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
        this.completionData = json.data;
        this.onStatusChanged.next();
        return;
      }

      await new Promise(r => setTimeout(r, this.sleepTime));
      this.sleepTime = Math.min(this.sleepTime * 1.1, 10000);
    }
  }
}
