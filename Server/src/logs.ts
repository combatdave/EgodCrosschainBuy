export type TxType = "BUY" | "SELL" | "NONE";


export class Logger {
    public static logs: any[] = [];

    public static Log(log: any) {
        log.timestamp = new Date().toISOString();
        Logger.logs.push(log);
    }
}