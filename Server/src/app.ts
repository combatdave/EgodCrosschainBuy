
import { provider_bsc, provider_dogechain } from "./connections";
import { StartServer as StartWebServer } from "./web";
import { Oracle } from "./oracle";
import { BridgeDogeV3 } from "./bridgedoge/bridgedogev3";

const bridgedogeV3 = new BridgeDogeV3(provider_bsc, provider_dogechain);
const oracle = new Oracle(bridgedogeV3);

StartWebServer(oracle);

(async function main () {
})();
