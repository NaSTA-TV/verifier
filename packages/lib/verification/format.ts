import { type CheckOutput, CheckStatus } from ".";

export function formatCheckOutputForSheets(checkOutput: CheckOutput[]) {
  const lines: string[] = checkOutput
    .filter((c) => c.status !== CheckStatus.SUCCESS)
    .map((check) => {
      let statusString: string;
      switch (check.status) {
        case CheckStatus.SUCCESS:
          statusString = "SUCCESS";
          break;
        case CheckStatus.WARNING:
          statusString = "WARNING";
          break;
        case CheckStatus.ERROR:
          statusString = "ERROR";
      }
      return `- ${check.name} - ${statusString} - ${check.message}`;
    });

  return lines.join("\n");
}

export function formatCheckOutputOverallStatus(
  checkOutput: CheckOutput[],
): "SUCCESS" | "WARNING" | "ERROR" {
  const error = checkOutput.find((v) => v.status === CheckStatus.ERROR);
  if (error) return "ERROR";
  const warning = checkOutput.find((v) => v.status === CheckStatus.WARNING);
  if (error) return "WARNING";
  return "SUCCESS";
}
