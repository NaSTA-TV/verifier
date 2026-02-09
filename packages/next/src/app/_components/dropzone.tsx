import { Card, Group, Text } from "@mantine/core";
import { Dropzone, type DropzoneProps, MIME_TYPES } from "@mantine/dropzone";
import { FaUpload, FaVideo } from "react-icons/fa";
import { FaX } from "react-icons/fa6";

export function VideoDropzone(props: Partial<DropzoneProps>) {
  return (
    <Card withBorder>
      <Dropzone
        onDrop={(files) => console.log("accepted files", files)}
        onReject={(files) => console.log("rejected files", files)}
        accept={[MIME_TYPES.mp4]}
        maxFiles={1}
        style={{
          cursor: "pointer",
        }}
        {...props}
      >
        <Group
          justify="center"
          gap="xl"
          mih={220}
          style={{ pointerEvents: "none" }}
        >
          <Dropzone.Accept>
            <FaUpload
              size={52}
              color="var(--mantine-color-blue-6)"
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <FaX
              size={52}
              color="var(--mantine-color-red-6)"
            />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <FaVideo
              size={52}
              color="var(--mantine-color-dimmed)"
            />
          </Dropzone.Idle>

          <div>
            <Text
              size="xl"
              inline
            >
              Drag your video here or click to select files
            </Text>
            <Text
              size="sm"
              c="dimmed"
              inline
              mt={7}
            >
              Attach only a single video file
            </Text>
          </div>
        </Group>
      </Dropzone>
    </Card>
  );
}
