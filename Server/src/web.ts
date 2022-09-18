import express, { Express, Request, Response } from 'express';
import cors from "cors";
import { BSCEgodXCSenderWatcher, EgodCrossChainBuyData } from './bsc-updates';
import { Logger } from "./logs";
import { Oracle } from './oracle';
const path = require('path');



function getLogsHTML() {
    let html = "";
    Logger.logs.forEach((log: object) => {
        let inner = "";
        for (let key in log) {
            inner += `<div>${key}: ${log[key]}</div>`
        }
        html += `<div style='margin: 5px; background: #eeeeee;'>${inner}</div>`;
    });
    html = "<h2>Logs</h2>" + html;
    return html;
}


export async function StartServer(bscObserver: BSCEgodXCSenderWatcher, oracle: Oracle) {

    const PORT = process.env.PORT || 5000;
    const app: Express = express();

    app.use(cors());

    app.listen(PORT, () => {
        console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
    });

    app.get('/', (req: Request, res: Response) => {        
        res.send(`
        <body style="font-family: monospace">
            <h1>Egod Crosschain Oracle</h1>
            ${getLogsHTML()}
        </body>
        `);
    });

    app.post("/processtx", async (req: Request, res: Response) => {
        let txhash = req.query.txhash as string;
        let d = {
            status: "error",
        }
        if (txhash) {
            let pendingBuy = await oracle.getPendingTxData(txhash);
            if (pendingBuy) {
                const processed = await oracle.checkProcessedStatus(pendingBuy);
                d.status = "already processed";
            }

            try {
                const startedProcessing = await bscObserver.processHash(txhash);
                if (startedProcessing) {
                    d.status = "requested processing";
                } else {
                    d.status = "error";
                }
            } catch (e) {
                d.status = "failed to process: " + e;
            }
        } else {
            d.status = "missing arg txhash";
        }
        res.json(d);
    });


    app.get("/txstatus", async (req: Request, res: Response) => {
        let txhash = req.query.txhash as string;
        let d = {
            txhash: txhash,
            status: "unknown",
            data: undefined
        }

        if (txhash) {
            let pendingTxData = await oracle.getPendingTxData(txhash);
            if (pendingTxData) {
                d.status = "pending";
                d.data = pendingTxData
            } else {
                const completedTxData = await oracle.getCompletedBuyData(txhash);
                if (completedTxData) {
                    d.status = "complete";
                    d.data = completedTxData;
                }
            }
        }
        res.json(d);
    });
}