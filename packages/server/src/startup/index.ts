// import { checkMinioConnection } from "@repo/lib/minio";
import { checkDatabaseConnection } from "../lib";

export async function runStartupTasks() {
  await checkDatabaseConnection();

  // await checkMinioConnection();
}
