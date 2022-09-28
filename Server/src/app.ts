
import { provider_bsc, provider_dogechain, provider_eth } from "./connections";
import { StartServer as StartWebServer } from "./web";
import { Oracle } from "./oracle";
import { Transmuter_Synapse } from "./synapse/synapse";
// import { BridgeDogeV3 } from "./bridgedoge/bridgedogev3";

// const bridgedogeV3 = new BridgeDogeV3(provider_bsc, provider_dogechain);

const synapse = new Transmuter_Synapse(provider_eth, provider_dogechain)
const oracle = new Oracle(synapse);

StartWebServer(oracle);

(async function main () {
})();
