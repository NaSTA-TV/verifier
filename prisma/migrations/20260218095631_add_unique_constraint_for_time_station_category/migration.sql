/*
  Warnings:

  - A unique constraint covering the columns `[timestamp,station,categoryString]` on the table `Submission` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Submission_timestamp_station_categoryString_key" ON "Submission"("timestamp", "station", "categoryString");
