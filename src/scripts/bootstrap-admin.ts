import "dotenv/config";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";

function getArg(flag: string) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const email = getArg("--email") ?? process.env.ADMIN_EMAIL;
  const password = getArg("--password") ?? process.env.ADMIN_PASSWORD;
  const name = getArg("--name") ?? process.env.ADMIN_NAME ?? "平台管理员";

  if (!email || !password) {
    throw new Error("Usage: pnpm bootstrap:admin --email admin@example.com --password 'StrongPass123!' [--name 管理员]");
  }

  const [existing] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const user =
    existing ??
    (
      await auth.api.signUpEmail({
        body: {
          email,
          password,
          name,
        },
      })
    ).user;

  await db
    .update(users)
    .set({
      name,
      role: "admin",
      emailVerified: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  console.log(JSON.stringify({ success: true, userId: user.id, email }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
