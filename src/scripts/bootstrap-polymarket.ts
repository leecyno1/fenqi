import "dotenv/config";

import { syncPolymarketCatalog, syncPolymarketPrices } from "@/lib/integrations/sync-polymarket";
import { cacheRemoteImage } from "@/lib/integrations/image-cache";

async function main() {
  const catalog = await syncPolymarketCatalog({
    limit: 200,
    active: true,
    cacheImage: cacheRemoteImage,
    skipNewsEnrichment: process.env.SKIP_NEWS_ENRICHMENT === "true",
  });
  const prices = await syncPolymarketPrices({ limit: 60 });

  console.log(JSON.stringify({ success: true, catalog, prices }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
