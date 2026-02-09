import z from "zod";
import type { probeOutputSchema } from "../zod";

export enum CheckStatus {
  SUCCESS,
  WARNING,
  ERROR,
}

export type CheckOutput = {
  name: string;
  status: CheckStatus;
  message: string;
};

export class CheckError extends Error {
  status: CheckStatus;
  constructor(checkOutput: CheckOutput) {
    super(checkOutput.message);

    this.status = checkOutput.status;
  }
}

export function verifyProbeOutput(
  probeOutput: z.infer<typeof probeOutputSchema>,
): CheckOutput[] {
  const checks = [];
  const checkStreamsOutput = checkStreams(probeOutput);
  if (checkStreamsOutput.status === CheckStatus.ERROR) {
    return [checkStreamsOutput];
  } else {
    checks.push(checkStreamsOutput);
  }

  const checkFunctions = [
    checkVideoFormat,
    checkVideoResolution,
    checkVideoFrameRate,
    checkVideoFieldOrder,
    checkVideoAspect,
    checkVideoPAL,
    checkVideoBitrate,
    checkAudioSettings,
    checkAudioSampleRate,
    checkAudioChannels,
    checkAudioBitrate,
  ];

  const checkFunctionsOutput = checkFunctions.map((f) => {
    try {
      return f(probeOutput);
    } catch (e) {
      if (e instanceof CheckError) {
        return {
          name: e.name,
          status: e.status,
          message: e.message,
        };
      }
      return {
        name: "Error",
        status: CheckStatus.ERROR,
        message: `An unknown error occurred running a check ${f.name}: ${(e as Error).message}`,
      };
    }
  });

  checks.push(...checkFunctionsOutput);

  return checks;
}

function checkStreams(
  probeOutput: z.infer<typeof probeOutputSchema>,
): CheckOutput {
  if (probeOutput.streams.length === 2) {
    if (!probeOutput.streams.find((s) => s.codec_type === "video")) {
      return {
        name: "Streams",
        status: CheckStatus.ERROR,
        message: "No video stream found in file",
      };
    }
    if (!probeOutput.streams.find((s) => s.codec_type === "audio")) {
      return {
        name: "Streams",
        status: CheckStatus.ERROR,
        message: "No audio stream found in file",
      };
    }
    return {
      name: "Streams",
      status: CheckStatus.SUCCESS,
      message: "Found a video and an audio stream",
    };
  } else if (probeOutput.streams.length < 2) {
    return {
      name: "Streams",
      status: CheckStatus.ERROR,
      message:
        "Only a single video or audio stream found, there should be both a single video and audio stream",
    };
  }
  return {
    name: "Streams",
    status: CheckStatus.ERROR,
    message: "Only a single video and audio stream should be present",
  };
}

function checkVideoFormat(
  probeOutput: z.infer<typeof probeOutputSchema>,
): CheckOutput {
  const videoStream = getVideoStream("Video Format", probeOutput);

  const mp4 = probeOutput.format.format_name.includes("mp4");
  const h264 = videoStream.codec_name === "h264";

  if (mp4 && h264) {
    return {
      name: "Video Format",
      status: CheckStatus.SUCCESS,
      message: "Video stream is h264 in an mp4 container",
    };
  }

  return {
    name: "Video Format",
    status: CheckStatus.ERROR,
    message: `Video stream is ${h264 ? "" : "not "}h264 in a${mp4 ? "n mp4 container" : " container that isn't mp4"}`,
  };
}

function checkVideoResolution(
  probeOutput: z.infer<typeof probeOutputSchema>,
): CheckOutput {
  const videoStream = getVideoStream("Video Resolution", probeOutput);

  const width = videoStream.width;
  const height = videoStream.height;

  if (width === 1920 && height === 1080) {
    return {
      name: "Video Resolution",
      status: CheckStatus.SUCCESS,
      message: `Video stream is 1920x1080`,
    };
  } else if (width > 1920 || height > 1080) {
    return {
      name: "Video Resolution",
      status: CheckStatus.ERROR,
      message: `Video stream is ${width}x${height} which exceeds the allowed 1920x1080`,
    };
  }
  return {
    name: "Video Resolution",
    status: CheckStatus.WARNING,
    message: `Video stream is ${width}x${height} which is less than the recommended 1920x1080`,
  };
}

function checkVideoFrameRate(
  probeOutput: z.infer<typeof probeOutputSchema>,
): CheckOutput {
  const videoStream = getVideoStream("Video Frame Rate", probeOutput);

  const calc_rate = getFrameRate(videoStream);

  if (!calc_rate)
    return {
      name: "Video Frame Rate",
      status: CheckStatus.ERROR,
      message: `Failed to calculate Frame Rate from ${videoStream.r_frame_rate}`,
    };

  if (calc_rate === 25) {
    return {
      name: "Video Frame Rate",
      status: CheckStatus.SUCCESS,
      message: "Video stream is at 25 frames per second",
    };
  } else if (calc_rate < 25) {
    return {
      name: "Video Frame Rate",
      status: CheckStatus.WARNING,
      message: "Video stream is below the recommended 25 frames per second",
    };
  }
  return {
    name: "Video Frame Rate",
    status: CheckStatus.ERROR,
    message: `Video stream exceeds the maximum of 25 frames per second (found ${calc_rate}fps)`,
  };
}

function checkVideoFieldOrder(
  probeOutput: z.infer<typeof probeOutputSchema>,
): CheckOutput {
  const checkName = "Video Field Order";
  const videoStream = getVideoStream(checkName, probeOutput);

  const fieldOrder = videoStream.field_order;

  if (fieldOrder !== "progressive")
    return {
      name: checkName,
      status: CheckStatus.ERROR,
      message: `Video stream field order is not progressive (found ${fieldOrder})`,
    };

  return {
    name: checkName,
    status: CheckStatus.SUCCESS,
    message: `Video stream field order is progressive`,
  };
}

function checkVideoAspect(
  probeOutput: z.infer<typeof probeOutputSchema>,
): CheckOutput {
  const checkName = "Video Aspect";
  const videoStream = getVideoStream(checkName, probeOutput);

  const aspect = videoStream.sample_aspect_ratio;

  if (!aspect)
    return {
      name: checkName,
      status: CheckStatus.WARNING,
      message: `Video stream does not contain pixel aspect information`,
    };

  if (aspect !== "1:1") {
    return {
      name: checkName,
      status: CheckStatus.ERROR,
      message: `Video stream does not have a pixel aspect of 1:1 (found ${aspect})`,
    };
  }
  return {
    name: checkName,
    status: CheckStatus.SUCCESS,
    message: `Video stream has a pixel aspect of 1:1`,
  };
}

function checkVideoPAL(
  probeOutput: z.infer<typeof probeOutputSchema>,
): CheckOutput {
  const checkName = "Video PAL";
  const videoStream = getVideoStream(checkName, probeOutput);

  const calc_rate = getFrameRate(videoStream);

  if (!calc_rate)
    return {
      name: checkName,
      status: CheckStatus.ERROR,
      message: `Failed to calculate Frame Rate from ${videoStream.r_frame_rate}`,
    };

  if (!(calc_rate === 50 || calc_rate === 25)) {
    return {
      name: checkName,
      status: CheckStatus.ERROR,
      message: `Video stream is likely not PAL (${calc_rate}fps)`,
    };
  }
  return {
    name: checkName,
    status: CheckStatus.SUCCESS,
    message: "Video stream is most likely PAL",
  };
}

function checkVideoBitrate(
  probeOutput: z.infer<typeof probeOutputSchema>,
): CheckOutput {
  const checkName = "Video Bitrate";
  const videoStream = getVideoStream(checkName, probeOutput);

  const bitrate = Number((videoStream.bit_rate / 1000 / 1000).toFixed(3));

  if (bitrate < 10) {
    return {
      name: checkName,
      status: CheckStatus.WARNING,
      message: `Video stream bitrate is less than the target 10Mbps (got ${bitrate}Mbps from ${videoStream.bit_rate})`,
    };
  } else if (bitrate > 15) {
    return {
      name: checkName,
      status: CheckStatus.ERROR,
      message: `Video stream bitrate is greater than the maximum 15Mbps (got ${bitrate}Mbps from ${videoStream.bit_rate})`,
    };
  }

  return {
    name: checkName,
    status: CheckStatus.SUCCESS,
    message: `Video stream bitrate is acceptable (got ${bitrate}Mbps from ${videoStream.bit_rate})`,
  };
}

function checkAudioSettings(
  probeOutput: z.infer<typeof probeOutputSchema>,
): CheckOutput {
  const checkName = "Audio Settings";
  const audioStream = getAudioStream(checkName, probeOutput);

  const codecName = audioStream.codec_name.toLowerCase();
  const profile = audioStream.profile.toLowerCase();

  if (codecName !== "aac")
    return {
      name: checkName,
      status: CheckStatus.ERROR,
      message: `Audio stream codec is not aac (found ${codecName})`,
    };

  if (profile !== "lc")
    return {
      name: checkName,
      status: CheckStatus.ERROR,
      message: `Audio stream profile is not lc (found ${profile})`,
    };

  return {
    name: checkName,
    status: CheckStatus.SUCCESS,
    message: `Audio stream codec is aac and profile is lc`,
  };
}

function checkAudioSampleRate(
  probeOutput: z.infer<typeof probeOutputSchema>,
): CheckOutput {
  const checkName = "Audio Sample Rate";
  const audioStream = getAudioStream(checkName, probeOutput);

  const sampleRate = audioStream.sample_rate;

  if (!(sampleRate === 48000 || sampleRate === 44100))
    return {
      name: checkName,
      status: CheckStatus.ERROR,
      message: `Audio sample rate is not 48kHz or 44.1 kHz (found ${sampleRate}Hz)`,
    };

  return {
    name: checkName,
    status: CheckStatus.SUCCESS,
    message: `Audio sample rate is ${sampleRate === 48000 ? "48" : "44.1"}kHz`,
  };
}

function checkAudioChannels(
  probeOutput: z.infer<typeof probeOutputSchema>,
): CheckOutput {
  const checkName = "Audio Channels";
  const audioStream = getAudioStream(checkName, probeOutput);

  const channelLayout = audioStream.channel_layout;
  const channels = audioStream.channels;

  if (channels > 2) {
    return {
      name: checkName,
      status: CheckStatus.ERROR,
      message: `Audio stream contains more than 2 channels (found ${channels})`,
    };
  } else if (channels === 1) {
    return {
      name: checkName,
      status: CheckStatus.WARNING,
      message: `Audio stream only contains one channel`,
    };
  }

  if (channelLayout !== "stereo") {
    return {
      name: checkName,
      status: CheckStatus.WARNING,
      message: `Audio stream contains 2 channels but layout is not stereo (found ${channelLayout})`,
    };
  }

  return {
    name: checkName,
    status: CheckStatus.SUCCESS,
    message: `Audio stream contains 2 channels in stereo`,
  };
}

function checkAudioBitrate(
  probeOutput: z.infer<typeof probeOutputSchema>,
): CheckOutput {
  const checkName = "Audio Bitrate";
  const audioStream = getAudioStream(checkName, probeOutput);

  const bitrate = Number((audioStream.bit_rate / 1000).toFixed(3));

  if (bitrate < 192) {
    return {
      name: checkName,
      status: CheckStatus.WARNING,
      message: `Audio stream bitrate is less than the target 192kbps (got ${bitrate}kbps from ${audioStream.bit_rate})`,
    };
  }

  return {
    name: checkName,
    status: CheckStatus.SUCCESS,
    message: `Audio stream bitrate is acceptable (got ${bitrate}kbps from ${audioStream.bit_rate})`,
  };
}

function getVideoStream(
  checkName: string,
  probeOutput: z.infer<typeof probeOutputSchema>,
) {
  const videoStream = probeOutput.streams.find((v) => v.codec_type === "video");

  if (!videoStream)
    throw new CheckError({
      name: checkName,
      status: CheckStatus.ERROR,
      message: `Failed to find video stream for check ${checkName}`,
    });

  return videoStream;
}

function getAudioStream(
  checkName: string,
  probeOutput: z.infer<typeof probeOutputSchema>,
) {
  const videoStream = probeOutput.streams.find((v) => v.codec_type === "audio");

  if (!videoStream)
    throw new CheckError({
      name: checkName,
      status: CheckStatus.ERROR,
      message: `Failed to find audio stream for check ${checkName}`,
    });

  return videoStream;
}

function getFrameRate(videoStream: ReturnType<typeof getVideoStream>) {
  const frameRate = videoStream.r_frame_rate;

  const [one, two] = frameRate
    .split("/")
    .map((v) => z.coerce.number().parse(v));

  if (!(one && two)) return undefined;

  const calc_rate = Number((one / two).toFixed(2));

  return calc_rate;
}
