import { db } from "@repo/lib/db";
import { getDownloader, getDownloaderSlug } from "@repo/lib/downloader";

export async function checkNewlySupportedProviders() {
  console.log("┌ Clearing unsupported providers");

  const unsupportedOnes = await db.fileDownload.findMany({
    where: {
      status: "Unsupported",
    },
  });
  console.log(`| Found ${unsupportedOnes.length} unsupported files.`);

  const newlySupported = unsupportedOnes.filter(async (fileDl) => {
    const dl = getDownloader(fileDl.inputURL);
    if (!dl) return false;
  });

  console.log(`| Found ${newlySupported.length} newly supported files.`);

  for (const fileDl of newlySupported) {
    const dl = getDownloader(fileDl.inputURL);
    if (!dl) continue;
    const needsConfirmation = await dl.needsConfirmation(fileDl.inputURL);
    let singleFile: string | undefined;
    if (needsConfirmation) {
      const files = await dl.listPossibilities(fileDl.inputURL);
      if (files.length === 1) {
        singleFile = files.at(0)?.id;
      }
    } else {
      singleFile = dl.getIdFromUrl(fileDl.inputURL);
    }
    const dlSlug = getDownloaderSlug(fileDl.inputURL);
    await db.fileDownload.update({
      where: {
        id: fileDl.id,
      },
      data: {
        status:
          needsConfirmation && !singleFile ? "NeedsConfirmation" : "Confirmed",
        downloader: dlSlug,
        confirmedFile: singleFile,
      },
    });
  }

  console.log("└ Updated database with newly supported providers");
}

export async function resetStuckFiles() {
  console.log("┌ Resetting stuck files");

  const stuckOnes = await db.fileDownload.updateMany({
    where: {
      status: {
        in: ["Processing", "Downloaded"],
      },
    },
    data: {
      status: "Confirmed",
    },
  });

  console.log(`| Found ${stuckOnes.count} stuck files.`);
  console.log("└ Successfully reset stuck files");
}
