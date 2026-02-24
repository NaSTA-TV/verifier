import { checkMinioConnection } from "@repo/lib/minio";
import { checkDatabaseConnection } from "../lib";
import { checkNewlySupportedProviders, resetStuckFiles } from "./downloaders";

export async function runStartupTasks() {
  await checkDatabaseConnection();
  await checkMinioConnection();
  await resetStuckFiles();
  await checkNewlySupportedProviders();
}
