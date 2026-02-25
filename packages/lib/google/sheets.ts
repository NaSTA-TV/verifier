import dayjs from "dayjs";
import { google } from "googleapis";
import z from "zod";
import { db } from "../db";
import { SubmissionStatus } from "../db/generated/prisma/enums";
import { env } from "../env";
import { getIO } from "../socket/server";
import { googleAuth } from ".";

export async function updateSubmissions() {
  const io = await getIO();

  const sheets = google.sheets({ version: "v4", auth: googleAuth });
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: env.SUBMISSIONS_SHEET_ID,
    range: "All Submissions!A2:S",
  });
  const rows = result.data.values;
  if (!rows || rows.length === 0) {
    console.log("No data found.");
    return;
  }
  // Print the name and major of each student.
  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    if (!row || row[0] === "") break;
    const parsedRow = parseRow(row);

    if (!parsedRow) continue;

    if (
      parsedRow.categoryString.includes("Marshall") ||
      parsedRow.categoryString.includes("Technical")
    )
      continue;

    await db.submission.upsert({
      where: {
        timestamp_station_categoryString: {
          timestamp: parsedRow.timestamp,
          station: parsedRow.station,
          categoryString: parsedRow.categoryString,
        },
      },
      update: {
        rowNum: 2 + idx,
        latest: parsedRow.latest,
        verified: parsedRow.verified,
        status: parsedRow.status,
      },
      create: {
        rowNum: 2 + idx,
        ...parsedRow,
        timestamp: parsedRow.timestamp,
      },
    });
  }

  io.in("users").emit("update:submissions");
}

export async function setTechSpecs(
  rowNum: number,
  statusString: "SUCCESS" | "WARNING" | "ERROR" | undefined,
  message: string,
) {
  const sheets = google.sheets({ version: "v4", auth: googleAuth });
  await sheets.spreadsheets.values.update({
    spreadsheetId: env.SUBMISSIONS_SHEET_ID,
    range: `All Submissions!L${rowNum}:M${rowNum}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      range: `All Submissions!L${rowNum}:M${rowNum}`,
      values: [[statusString, message]],
    },
  });
}

function processSheetDate(v: string) {
  return v
    .split(" ")
    .map((t, i) => (i === 0 ? t.split("/").reverse().join("-") : t))
    .join("T");
}

const rowSchema = z.object({
  timestamp: z.preprocess((v) => {
    const d = dayjs(processSheetDate(v as string)).toISOString();

    return d;
  }, z.coerce.date()),
  submitterEmail: z.string(),
  submitterFullName: z.string(),
  station: z.string(),
  categoryString: z.string(),
  submissionName: z.string(),
  submittedLink: z.string(),
  submissionLength: z.string(),
  writtenSubmission: z.string(),
  verificationLink: z.string(),
  clocked: z.coerce.boolean(),
  IDinSheet: z.string(),
  latest: z.coerce.boolean(),
  verified: z.coerce.boolean(),
  assigned: z.coerce.boolean(),
  status: z.preprocess((v) => {
    if (typeof v === "string" && v === "Rule break") {
      return "RuleBreak";
    }
    return v;
  }, z.enum(SubmissionStatus)),
});

function parseRow(row: unknown[]) {
  const [
    timestamp,
    submitterEmail,
    submitterFullName,
    station,
    categoryString,
    submissionName,
    submittedLink,
    submissionLength,
    writtenSubmission,
    verificationLink,
    clocked,
    _techSpecsDetails,
    _techSpecsYN,
    IDinSheet,
    _IDnum,
    latest,
    verified,
    assigned,
    status,
  ] = row;

  const parsed = rowSchema.safeParse({
    timestamp,
    submitterEmail,
    submitterFullName,
    station,
    categoryString,
    submissionName,
    submittedLink,
    submissionLength,
    writtenSubmission,
    verificationLink,
    clocked,
    IDinSheet,
    latest,
    verified,
    assigned,
    status,
  });

  if (parsed.success) return parsed.data;
}
