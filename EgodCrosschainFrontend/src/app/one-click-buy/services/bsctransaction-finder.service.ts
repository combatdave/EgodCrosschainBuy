import { Injectable } from '@angular/core';
import { BigNumber, ethers } from 'ethers';
import EgodXCRDeployment from "../../../../../Hardhat/deployments/dogechain/EgodXCReciever.json";

export type HistoricalTransaction = {
  hash: string;
  blockNumber: number;
  timestamp: number;
  amount: BigNumber;
}

@Injectable({
  providedIn: 'root'
})
export class BSCTransactionFinderService {

  constructor() { }

  public async findTransactions(address: string) : Promise<HistoricalTransaction[]>{
    const topic_LogAnySwapOut = "0x97116cf6cd4f6412bb47914d6db18da9e16ab2142f543b86e207c24fbd16b23a";
    const BSC_MULTICHAIN_ADDR = "0xf9736ec3926703e85c843fc972bd89a7f8e827c0";
    const tokenAddressEncoded = ethers.utils.defaultAbiCoder.encode(["address"], ["0x57f3fee2cfa3769fd25e3774eb514face7c70beb"]);
    const myAddressEncoded = ethers.utils.defaultAbiCoder.encode(["address"], [address]);
    const egodXCRAddressEncoded = ethers.utils.defaultAbiCoder.encode(["address"], [EgodXCRDeployment.address]);
    const apiKey = "T9IBQYS4IV3SCFZRCP8V5U58N2PPGZ1MKR";

    const url = `https://api.bscscan.com/api?module=logs&action=getLogs&fromBlock=0&address=${BSC_MULTICHAIN_ADDR}&topic0=${topic_LogAnySwapOut}&topic1=${tokenAddressEncoded}&topic2=${myAddressEncoded}&topic3=${egodXCRAddressEncoded}&apikey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
  
    const raw_transactions = data.result as any[];

    const transactions: HistoricalTransaction[] = [];

    raw_transactions.forEach((raw_transaction: any) => {
      const [amount, fromChainID, toChainID] = ethers.utils.defaultAbiCoder.decode(["uint256", "uint256", "uint256"], raw_transaction.data);
      const tx: HistoricalTransaction = {
        hash: raw_transaction.transactionHash,
        blockNumber: parseInt(raw_transaction.blockNumber, 16),
        timestamp: parseInt(raw_transaction.timeStamp, 16),
        amount: amount
      }
      transactions.push(tx);
    });

    return transactions;
  }
}
