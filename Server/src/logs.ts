export type TxType = "BUY" | "SELL" | "NONE";


export class Logger {
    public static logs: any[] = [];

    public static Log(log: any) {
        Logger.logs.push(log);
    }
}