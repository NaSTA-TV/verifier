"use client";

import {
  Alert,
  Button,
  Center,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { DownloadStatus } from "@repo/lib/db/generated/prisma/enums";
import { useSocketTriggeredFunction } from "@repo/lib/socket/client";
import { useParams } from "next/navigation";
import { FaCircleInfo } from "react-icons/fa6";
import { PossibilitiesTable } from "@/app/_components/possible-files-table";
import { api } from "@/trpc/react";

export default function SubmissionPage() {
  const params = useParams<{ submissionId: string }>();

  const submissionQuery = api.submissions.get.useQuery({
    submissionId: params.submissionId,
  });

  useSocketTriggeredFunction(`update:submission:${params.submissionId}`, () =>
    submissionQuery.refetch(),
  );

  const downloadFile = api.submissions.downloadFile.useMutation();

  if (!submissionQuery.data)
    return (
      <Center>
        <Loader />
      </Center>
    );

  return (
    <Stack>
      <Title>{submissionQuery.data.IDinSheet}</Title>
      <Text>{submissionQuery.data.submittedLink}</Text>
      {submissionQuery.data.submittedLink &&
        submissionQuery.data.fileDownloadId &&
        submissionQuery.data.fileDownload?.status ===
          DownloadStatus.NeedsConfirmation && (
          <>
            <Alert icon={<FaCircleInfo />} title="Warnings" color="orange">
              This submission needs it's file to be confirmed before continuing.
            </Alert>
            <PossibilitiesTable submissionId={params.submissionId} />
          </>
        )}
      {submissionQuery.data.fileDownload &&
        submissionQuery.data.fileDownload.status ===
          DownloadStatus.Confirmed && (
          <Button
            onClick={() => {
              downloadFile.mutateAsync({ submissionId: params.submissionId });
            }}
          >
            Download it
          </Button>
        )}
    </Stack>
  );
}
