import assert from "node:assert";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import type z from "zod";
import { db } from "../db";
import type { FileDownload, Submission } from "../db/generated/prisma/client";
import { env } from "../env";
import { setTechSpecs } from "../google";
import { getMinioClient } from "../minio";
import { getIO } from "../socket/server";
import {
  formatCheckOutputForSheets,
  formatCheckOutputOverallStatus,
  verifyProbeOutput,
} from "../verification";
import { probeOutputSchema } from "../zod";
import { GoogleDriveDownloader } from "./providers/google";

export interface FileDownloader {
  urlRegex: RegExp;
  needsConfirmation: (url: string) => Promise<boolean>;
  listPossibilities: (url: string) => Promise<{ name: string; id: string }[]>;
  getIdFromUrl: (url: string) => string | undefined;
  downloadFile: (
    submissionId: string,
  ) => Promise<{ ok: false } | { ok: true; path: string }>;
}

export const downloaders: Record<string, FileDownloader> = {
  gdrive: GoogleDriveDownloader,
};

export function getDownloader(url: string): FileDownloader | undefined {
  for (const [_slug, dl] of Object.entries(downloaders)) {
    if (dl.urlRegex.test(url)) return dl;
  }
}

export function getDownloaderSlug(url: string): string | undefined {
  for (const [slug, dl] of Object.entries(downloaders)) {
    if (dl.urlRegex.test(url)) return slug;
  }
}

export async function newSubConfStatus() {
  const io = await getIO();

  const unprocessedSubmissions = await db.submission.findMany({
    where: {
      fileDownloadId: {
        equals: null,
      },
    },
  });

  for (const sub of unprocessedSubmissions) {
    const dlSlug = getDownloaderSlug(sub.submittedLink);
    const downloader = dlSlug ? downloaders[dlSlug] : undefined;

    if (!dlSlug || !downloader) {
      await db.submission.update({
        where: {
          id: sub.id,
        },
        data: {
          fileDownload: {
            create: { inputURL: sub.submittedLink, status: "Unsupported" },
          },
        },
      });
    } else {
      const needsConfirmation = await downloader.needsConfirmation(
        sub.submittedLink,
      );
      let singleFile: string | undefined;
      if (needsConfirmation) {
        const files = await downloader.listPossibilities(sub.submittedLink);
        console.log(files);
        if (files.length === 1) {
          console.log(files);
          singleFile = files.at(0)?.id;
        }
      } else {
        singleFile = downloader.getIdFromUrl(sub.submittedLink);
      }
      await db.submission.update({
        where: {
          id: sub.id,
        },
        data: {
          fileDownload: {
            create: {
              inputURL: sub.submittedLink,
              status:
                needsConfirmation && !singleFile
                  ? "NeedsConfirmation"
                  : "Confirmed",
              downloader: dlSlug,
              confirmedFile: singleFile,
            },
          },
        },
      });
    }

    io.in("users").emit(`update:submission:${sub.id}`);
  }
}

export async function processQueue() {
  const isProcessing = await db.submission.findFirst({
    where: {
      fileDownload: {
        status: "Processing",
      },
    },
  });

  if (isProcessing !== null)
    return console.log(
      "processQueue called while something is being processed, ignoring",
    );

  const next = await db.submission.findFirst({
    where: {
      fileDownload: {
        status: "Confirmed",
        confirmedFile: {
          not: null,
        },
      },
    },
    include: {
      fileDownload: true,
    },
    orderBy: {
      timestamp: "asc",
    },
  });

  if (next === null) return console.log("No next item in queue!");

  console.log("Processing next submission in queue:");
  console.log(`ID:        ${next.id}`);
  console.log(`Station:   ${next.station}`);
  console.log(`Category:  ${next.categoryString}`);
  console.log(`Timestamp: ${next.timestamp}\n`);

  if (next.fileDownload === null)
    return console.log("Item somehow doesn't have a FileDownload attached");

  await db.fileDownload.update({
    where: {
      id: next.fileDownload.id,
    },
    data: {
      status: "Processing",
    },
  });

  assert(next.fileDownload !== null);

  console.log(`Downloading ${next.id}, fd ${next.fileDownload.id}`);
  const status = await downloadFile(next as SubmissionWithFileDownload);
  console.log(
    `Downloading ${next.id}, fd ${next.fileDownload.id} ${status.ok ? "SUCCEDDED" : "FAILED"}`,
  );
  if (!status.ok) {
    await db.fileDownload.update({
      where: {
        id: next.fileDownload.id,
      },
      data: {
        status: "Failed",
      },
    });
    return;
  }

  await db.fileDownload.update({
    where: {
      id: next.fileDownload.id,
    },
    data: {
      status: "Downloaded",
    },
  });

  const probe = await new Promise<
    { ok: false } | { ok: true; output: z.infer<typeof probeOutputSchema> }
  >((resolve) => {
    const probeOutputPath = status.path.concat(".json");

    const ffprobe = spawn(process.env.FFPROBE_PATH ?? "ffmpeg", [
      "-v",
      "error",
      "-show_format",
      "-show_entries",
      "stream",
      "-print_format",
      "json",
      status.path,
      "-o",
      probeOutputPath,
    ]);

    ffprobe.on("close", async (code) => {
      if (code !== 0) {
        console.log(`ffprobe ${status.path} FAILED`);
        return resolve({ ok: false });
      }
      console.log(`ffprobe ${status.path} SUCCESS`);
      try {
        const jsonText = await readFile(probeOutputPath, { encoding: "utf8" });
        const json = JSON.parse(jsonText);
        const probeOutput = probeOutputSchema.parse(json);
        return resolve({ ok: true, output: probeOutput });
      } catch (_) {
        console.log("Failed to parse ffprobe output");
        return resolve({ ok: false });
      }
    });

    ffprobe.stderr.on("data", console.log);
  });

  if (!probe.ok) return probe;

  const verified = verifyProbeOutput(probe.output);

  const verifiedFormatted = formatCheckOutputForSheets(verified);

  await db.fileDownload.update({
    where: {
      id: next.fileDownload.id,
    },
    data: {
      status: "Passed",
    },
  });

  await setTechSpecs(
    next.rowNum,
    formatCheckOutputOverallStatus(verified),
    verifiedFormatted,
  );

  const mc = await getMinioClient();

  const s3path = `${next.categoryString.toLowerCase().replace(" ", "-")}/${next.station.toLowerCase().replace(" ", "-")}.mp4`;

  const s3putRes = await mc.fPutObject(env.MINIO_BUCKET, s3path, status.path);

  await db.fileDownload.update({
    where: {
      id: next.fileDownload.id,
    },
    data: {
      s3Path: s3path,
    },
  });
}

export type SubmissionWithFileDownload = Submission & {
  fileDownload: FileDownload;
};

export async function downloadFile(
  submission: SubmissionWithFileDownload,
): Promise<{ ok: false } | { ok: true; path: string }> {
  if (
    !submission.fileDownload.downloader ||
    !submission.fileDownload.confirmedFile
  )
    return { ok: false };

  const dl = downloaders[submission.fileDownload.downloader];

  if (!dl) return { ok: false };

  console.log(`Downloading using ${submission.fileDownload.downloader}`);

  const res = await dl.downloadFile(submission.fileDownload.confirmedFile);

  return res;
}
