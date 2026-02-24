-- CreateEnum
CREATE TYPE "DownloadStatus" AS ENUM ('Unsupported', 'NeedsConfirmation', 'Confirmed', 'Downloaded', 'Processing', 'Passed', 'Failed');

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "fileDownloadId" TEXT;

-- CreateTable
CREATE TABLE "FileDownload" (
    "id" TEXT NOT NULL,
    "inputURL" TEXT NOT NULL,
    "confirmedFile" TEXT,
    "status" "DownloadStatus" NOT NULL,

    CONSTRAINT "FileDownload_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_fileDownloadId_fkey" FOREIGN KEY ("fileDownloadId") REFERENCES "FileDownload"("id") ON DELETE SET NULL ON UPDATE CASCADE;
