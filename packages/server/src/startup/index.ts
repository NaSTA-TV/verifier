// import { checkMinioConnection } from "@repo/lib/minio";
import { checkDatabaseConnection } from "../lib";
// import { runCreditStartupTasks } from "./credits";

export async function runStartupTasks() {
  await checkDatabaseConnection();

  // await checkMinioConnection();

  // await runCreditStartupTasks();
}
