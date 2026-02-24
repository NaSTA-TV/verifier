import z from "zod";

export const probeOutputSchema = z.object({
  streams: z.array(
    z.union([
      z.object({
        codec_type: z.literal("video"),
        codec_name: z.string(),
        width: z.number(),
        height: z.number(),
        sample_aspect_ratio: z.string().optional(),
        display_aspect_ratio: z.string().optional(),
        bit_rate: z.coerce.number(),
        field_order: z.string(),
        r_frame_rate: z.string().includes("/"),
      }),
      z.object({
        codec_type: z.literal("audio"),
        codec_name: z.string(),
        profile: z.string().default("NONE"),
        sample_rate: z.coerce.number(),
        channels: z.number(),
        channel_layout: z.string(),
        bit_rate: z.coerce.number(),
      }),
      z.object({
        codec_type: z.literal("data"),
        codec_tag_string: z.string(),
      }),
    ]),
  ),
  format: z.object({
    filename: z.string(),
    nb_streams: z.number(),
    format_name: z.preprocess((v) => {
      if (typeof v === "string") {
        return v.split(",");
      }
      return null;
    }, z.array(z.string())),
    start_time: z.coerce.number(),
    duration: z.coerce.number(),
    size: z.coerce.number(),
    bit_rate: z.coerce.number(),
    probe_score: z.number(),
    // tags: {
    //   major_brand: "mp42",
    //   minor_version: "0",
    //   compatible_brands: z.string(),
    //   creation_time: z.iso.datetime(),
    // },
  }),
});
