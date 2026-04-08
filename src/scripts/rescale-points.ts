import "dotenv/config";

import { sql } from "drizzle-orm";

import { db } from "@/db/client";
import { virtualWallets } from "@/db/schema";
import { POINT_SCALE } from "@/lib/points";

async function main() {
  const force = process.argv.includes("--force");
  const [walletStats] = await db
    .select({
      maxBalance: sql<number>`coalesce(max(${virtualWallets.balance}), 0)`,
    })
    .from(virtualWallets);

  const maxBalance = Number(walletStats?.maxBalance ?? 0);

  if (!force && maxBalance > 0 && maxBalance <= 2000) {
    console.log("Points appear already rescaled. Skip (use --force to override).");
    return;
  }

  await db.transaction(async (tx) => {
    await tx.execute(sql`
      update virtual_wallet
      set
        balance = round(balance::numeric / ${POINT_SCALE})::int,
        lifetime_pnl = round(lifetime_pnl::numeric / ${POINT_SCALE})::int,
        updated_at = now()
    `);

    await tx.execute(sql`
      update wallet_ledger
      set
        amount = round(amount::numeric / ${POINT_SCALE})::int,
        balance_after = round(balance_after::numeric / ${POINT_SCALE})::int
    `);

    await tx.execute(sql`
      update trade
      set
        total_cost = greatest(0, round(total_cost::numeric / ${POINT_SCALE})::int),
        average_price = greatest(0, round(average_price::numeric / ${POINT_SCALE})::int)
    `);

    await tx.execute(sql`
      update position
      set
        total_cost = greatest(0, round(total_cost::numeric / ${POINT_SCALE})::int),
        updated_at = now()
    `);

    await tx.execute(sql`
      update market
      set
        volume_points = greatest(0, round(volume_points::numeric / ${POINT_SCALE})::int),
        updated_at = now()
    `);

    await tx.execute(sql`
      with trader_counts as (
        select market_id, count(distinct user_id)::int as active_traders
        from trade
        group by market_id
      )
      update market m
      set
        active_traders = coalesce(tc.active_traders, 0),
        updated_at = now()
      from trader_counts tc
      where m.id = tc.market_id
    `);

    await tx.execute(sql`
      update market
      set
        active_traders = 0,
        updated_at = now()
      where id not in (select distinct market_id from trade)
    `);
  });

  console.log(`Rescaled points by 1/${POINT_SCALE}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$client.end();
  });
