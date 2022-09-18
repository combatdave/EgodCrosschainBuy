
import { BridgeDogeWatcher, DOGEBRIDGE_DC_ADDRESS } from "./dogechain-updates";
import { BSCEgodXCSenderWatcher } from "./bsc-updates";
import { contract_egodXCSender_bsc, DC_SAVIOR_ADDR, getDogechainRecieverContract, provider_bsc } from "./connections";
import { StartServer as StartWebServer } from "./web";
import { Oracle } from "./oracle";

const oracle = new Oracle();
const bscObserver = new BSCEgodXCSenderWatcher(contract_egodXCSender_bsc, provider_bsc);
const dogechainObserver = new BridgeDogeWatcher(oracle);


oracle.listen(bscObserver, dogechainObserver);
StartWebServer(bscObserver, oracle);

(async function main () {
    await dogechainObserver.watch();
})();
