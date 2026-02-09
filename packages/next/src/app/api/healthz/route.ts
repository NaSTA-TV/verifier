// eslint-disable-next-line @typescript-eslint/no-restricted-imports

import { db } from "@repo/lib/db";
import { sql } from "@repo/lib/db/generated/prisma/internal/prismaNamespace";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.$executeRaw(sql`SELECT 1;`);
  } catch (_e) {
    return NextResponse.json(
      { status: "not ok :(", reason: "Could not connect to database" },
      { status: 500 },
    );
  }
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
