import path from "node:path";
import process from "node:process";
import { google } from "googleapis";

export * from "./sheets";

// The scope for reading file metadata.
const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
];
// The path to the credentials file.
const CREDENTIALS_PATH = path.join(process.cwd(), "secrets/credentials.json");

export const googleAuth = new google.auth.GoogleAuth({
  scopes: SCOPES,
  keyFile: CREDENTIALS_PATH,
});
/**
 * Lists the names and IDs of up to 10 files.
 */
export async function listFiles(url: string) {
  const fileId = getFolderId(url);

  const drive = google.drive({ version: "v3", auth: googleAuth });
  const result = await drive.files.list({
    pageSize: 10,
    q: `'${fileId}' in parents`,
    fields: "nextPageToken, files(id, name)",
  });
  const files = result.data.files;
  return files;
}

export function getFolderId(url: string) {
  return url
    .replace(/https:\/\/drive\.google\.com\/drive\/folders\//, "")
    .split("?")
    .at(0);
}
