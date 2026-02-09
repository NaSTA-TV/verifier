"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { Alert, Button, Center, Loader, Space, Table } from "@mantine/core";
import type { FileWithPath } from "@mantine/dropzone";
import {
  type CheckOutput,
  CheckStatus,
  verifyProbeOutput,
} from "@repo/lib/verification";
import { probeOutputSchema } from "@repo/lib/zod";
import { useEffect, useRef, useState } from "react";
import { FaExclamation } from "react-icons/fa";
import {
  FaCircleCheck,
  FaCircleInfo,
  FaCircleXmark,
  FaFile,
} from "react-icons/fa6";
import type z from "zod";
import { VideoDropzone } from "../_components/dropzone";

export function Verify() {
  const [file, setFile] = useState<FileWithPath>();
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);

  const [error, setError] = useState<string>();

  const [output, setOutput] = useState<z.infer<typeof probeOutputSchema>>();
  const [checks, setChecks] = useState<CheckOutput[]>();

  const load = async () => {
    const baseURL =
      "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("log", ({ message }) => {
      if (messageRef.current) messageRef.current.innerHTML = message;
    });
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm",
      ),
    });
    setLoaded(true);
  };

  const probe = async () => {
    setError(undefined);
    const ffmpeg = ffmpegRef.current;
    // u can use 'https://ffmpegwasm.netlify.app/video/video-15s.avi' to download the video to public folder for testing
    await ffmpeg.writeFile("input.mp4", await fetchFile(file));
    const status = await ffmpeg.ffprobe([
      "-v",
      "error",
      "-show_format",
      "-show_entries",
      "stream",
      "-print_format",
      "json",
      "input.mp4",
      "-o",
      "output.json",
    ]);

    if (status !== -1) {
      setError("Failed to probe video file");
      return;
    }

    const data = await ffmpeg.readFile("output.json");

    let text: string;

    if (typeof data !== "string") {
      text = new TextDecoder().decode(data);
    } else {
      text = data;
    }

    let dataJson: unknown;

    try {
      dataJson = JSON.parse(text);
    } catch (_) {
      setError("Failed to parse ffprobe output to JSON");
      return;
    }

    const probeOutput = probeOutputSchema.safeParse(dataJson);

    if (!probeOutput.success) {
      console.log(probeOutput.error);
      setError("Failed to parse ffprobe output with Zod");
      return;
    }

    console.log(probeOutput.data);
    setOutput(probeOutput.data);

    const verifiedOutput = verifyProbeOutput(probeOutput.data);

    setChecks(verifiedOutput);
  };

  useEffect(() => {
    if (!isLoading && !loaded) {
      setIsLoading(true);
      load();
    }
  });

  return (
    <>
      <Alert
        icon={<FaCircleInfo />}
        title=""
        color="orange"
      >
        This page should be used as a guide for whether or not your video
        submission meets the required technical specs. If you have any questions
        about the validity of your submission please reach out to the Returning
        Officer at <a href="mailto:ro@nasta.tv">ro@nasta.tv</a>. If you notice
        any bugs or other issues with this site, please reach out to the
        Technical Officer at <a href="mailto:tech@nasta.tv">tech@nasta.tv</a>.
      </Alert>
      {!loaded && isLoading ? (
        <Center>
          <Loader />
        </Center>
      ) : (
        <>
          {error && (
            <Alert
              icon={<FaCircleXmark />}
              title="Error"
              color="red"
            >
              {error}
            </Alert>
          )}
          <Space h={"md"} />
          <VideoDropzone
            onDrop={(files) => {
              setFile(files.at(0));
              setError(undefined);
            }}
            onReject={() => setError("That doesn't look like an MP4 file")}
          />
          <Space h={"md"} />
          {file && !error && (
            <Alert
              icon={<FaFile />}
              title="File Selected"
              color="blue"
            >
              {file.name}
            </Alert>
          )}
          <Space h={"md"} />
          <Button
            disabled={!file}
            onClick={probe}
          >
            Check
          </Button>
          <Space h={"md"} />
          {checks && (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Check</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Info</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {checks.map((c) => (
                  <Table.Tr key={c.name}>
                    <Table.Td>{c.name}</Table.Td>
                    <Table.Td>
                      {c.status === CheckStatus.SUCCESS ? (
                        <FaCircleCheck color="green" />
                      ) : c.status === CheckStatus.WARNING ? (
                        <FaExclamation color="orange" />
                      ) : (
                        <FaCircleXmark color="red" />
                      )}
                    </Table.Td>
                    <Table.Td>{c.message}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </>
      )}
    </>
  );
}
