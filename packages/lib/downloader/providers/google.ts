import { exec, spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import path from "node:path";
import util from "node:util";
import { google } from "googleapis";
import temp, { mkdir } from "temp";
import { db } from "../../db";
import { googleAuth, listFiles } from "../../google";
import type { FileDownloader } from "..";

const spawnAsync = util.promisify(spawn);

export const GoogleDriveDownloader: FileDownloader = {
  urlRegex: /https:\/\/drive\.google\.com\/.*/,
  needsConfirmation: async (url) => {
    if (url.startsWith("https://drive.google.com/drive/folders/")) return true;
    return false;
  },
  listPossibilities: async (url) => {
    const files = await listFiles(url);
    if (!files) return [];
    return files
      ?.map((f) => {
        if (typeof f.name === "string" && typeof f.id === "string") {
          return { name: f.name, id: f.id };
        }
        return undefined;
      })
      .filter((f) => f !== undefined);
  },
  getIdFromUrl: (url) => {
    return url
      .replace(/https:\/\/drive\.google\.com\/file\/d\//, "")
      .split("/")
      .at(0);
  },
  downloadFile: async (fileId) => {
    var tempName = temp.path({
      suffix: ".mp4",
      dir: path.join(process.cwd(), "tmp/"),
    });

    var dest = createWriteStream(tempName);

    const drive = google.drive({ version: "v3", auth: googleAuth });

    try {
      const result = await drive.files.get({
        fileId: fileId,
      });
    } catch (metaError) {
      console.log("gdrive downmeta fetch error:");
      console.log(metaError);
      return { ok: false };
    }

    try {
      const result = await drive.files.get(
        {
          fileId: fileId,
          alt: "media",
        },
        { responseType: "stream" },
      );

      const success = await new Promise<boolean>((resolve) => {
        result.data.on("end", () => resolve(true));
        result.data.on("error", () => resolve(false));
        result.data.pipe(dest);
      });

      if (!success) return { ok: false };

      return { ok: true, path: tempName };
    } catch (downloadError) {
      console.log("gdrive download error:");
      console.log(downloadError);
      return { ok: false };
    }
  },
};
