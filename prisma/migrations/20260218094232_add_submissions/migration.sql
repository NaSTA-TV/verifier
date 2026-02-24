-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('Replaced', 'Verified', 'RuleBreak', 'Assigned');

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "submitterEmail" TEXT NOT NULL,
    "submitterFullName" TEXT NOT NULL,
    "station" TEXT NOT NULL,
    "categoryString" TEXT NOT NULL,
    "submissionName" TEXT NOT NULL,
    "submittedLink" TEXT NOT NULL,
    "submissionLength" TEXT NOT NULL,
    "writtenSubmission" TEXT NOT NULL,
    "verificationLink" TEXT NOT NULL,
    "clocked" BOOLEAN NOT NULL,
    "sheetID" TEXT NOT NULL,
    "latest" BOOLEAN NOT NULL,
    "verified" BOOLEAN NOT NULL,
    "assigned" BOOLEAN NOT NULL,
    "status" "SubmissionStatus" NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);
