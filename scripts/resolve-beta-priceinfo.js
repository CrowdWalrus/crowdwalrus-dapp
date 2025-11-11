// Resolve the PriceInfoObject ID for a given Pyth feed on testnet (Beta channel).
// The current CrowdWalrus deployment (0xc762…) is still linked against this Beta state
// until the contracts are upgraded, so builders should keep using these IDs.
// Usage: node scripts/resolve-beta-priceinfo.js 0x<32-byte-feed-id-hex>
import { SuiClient } from "@mysten/sui/client";
import { SuiPythClient } from "@pythnetwork/pyth-sui-js";

const endpoint = "https://fullnode.testnet.sui.io";
// Beta channel state IDs per Pyth docs
const PYTH_STATE = "0x243759059f4c3111179da5878c12f68d612c21a8d54d85edc86164bb18be1c7c";
const WORMHOLE_STATE = "0x31358d198147da50db32eda2562951d53973a0c0ad5ed738e9b17d88b213d790";

async function main() {
  const feedId = (process.argv[2] || "").toLowerCase();
  if (!/^0x[0-9a-f]{64}$/.test(feedId)) {
    console.error("Provide a 32-byte hex feed id, e.g. 0x... (64 hex chars)");
    process.exit(1);
  }
  const provider = new SuiClient({ url: endpoint });
  const pyth = new SuiPythClient(provider, PYTH_STATE, WORMHOLE_STATE);
  const pkg = await pyth.getPythPackageId();
  const objId = await pyth.getPriceFeedObjectId(feedId);
  console.log(JSON.stringify({ pythPackageId: pkg, priceInfoObjectId: objId }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
