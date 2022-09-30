
import { provider_bsc, provider_dogechain, provider_eth } from "./connections";
import { StartServer as StartWebServer } from "./web";
import { Oracle } from "./oracle";
import { BridgeDogeV3 } from "./bridgedoge/bridgedogev3";
import { Synapse } from "./synapse/synapse";

// const bridgedogeV3 = new BridgeDogeV3(provider_bsc, provider_dogechain);
// const oracle = new Oracle(bridgedogeV3);

const synapse = new Synapse(provider_bsc, provider_dogechain);
const oracle = new Oracle(synapse);

StartWebServer(oracle);

(async function main () {
})();
