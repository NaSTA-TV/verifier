import {
  createServer as createHttpServer,
  type Server as HttpServer,
} from "node:http";
import { exit } from "node:process";
import { db } from "@repo/lib/db";
import { sql } from "@repo/lib/db/generated/prisma/internal/prismaNamespace";
import type { RequestHandler } from "next/dist/server/next";

export async function checkDatabaseConnection() {
  let connectionAttempts = 1;

  console.log("┌ Checking database connection");

  while (connectionAttempts <= 3) {
    try {
      await db.$executeRaw(sql`SELECT 1;`);
      console.log("└ Connection to database sucessful");
      return;
    } catch (_e) {
      console.log(
        `│ Database connection attempt ${connectionAttempts} failed, retrying...`,
      );
      await sleep(5000);
    }
    connectionAttempts += 1;
  }
  if (connectionAttempts > 3) {
    console.error(
      "└ Connection to database failed, exiting. Please check your configuration.",
    );
    exit(1);
  }
}

export async function prepareHttpServer(
  handler: RequestHandler,
): Promise<HttpServer> {
  const httpServer = createHttpServer(handler);

  return httpServer;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
