import { exit } from "node:process";
import dotenv from "dotenv";
import { z } from "zod";
import { getDefaults } from "./zod";

dotenv.config({ quiet: true });

const envSchema = z.object({
  AUTH_SECRET:
    process.env.NODE_ENV === "production" ? z.string() : z.string().optional(),
  DATABASE_URL: z
    .url()
    .default("postgresql://postgres:postgres@localhost:5432/verifier"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  SUBMISSIONS_SHEET_ID: z.string().optional(),
  // KEYCLOAK_ISSUER: z.string(),
  MINIO_ENDPOINT: z.string(),
  MINIO_USE_SSL: z.enum(["true", "false"]).default("false"),
  MINIO_BUCKET: z.string(),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
});

export function validateEnv(): z.infer<typeof envSchema> {
  if (process.env.SKIP_ENV_VALIDATION === "1") return getDefaults(envSchema);
  const envResult = envSchema.safeParse(process.env);
  if (!envResult.success) {
    console.error("Error: Bad env configuration");
    for (const error of envResult.error.issues) {
      console.error(
        `  - variable ${error.path.join(".")} ${error.code}, ${error.message}`,
      );
    }
    exit(1);
  }
  return envResult.data;
}

export const env = validateEnv();
