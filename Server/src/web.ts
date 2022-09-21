import express, { Express, Request, Response } from 'express';
import cors from "cors";
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


export async function StartServer(oracle: Oracle) {

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
            const processed = await oracle.checkBSCTransaction(txhash);
            if (processed) {
                d.status = "already processed";
            }
            try {
                const startedProcessing = await oracle.processHash(txhash);
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
        let d:any = {
            status: "unknown",
        }

        if (txhash) {
            d = await oracle.getTransactionStatus(txhash);
        } else {
            d.status = "missing arg txhash";
        }
        res.json(d);
    });
}