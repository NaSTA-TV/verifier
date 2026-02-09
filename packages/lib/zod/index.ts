import z from "zod";

export * from "./probe";

export function getDefaults<Schema extends z.ZodObject>(
  schema: Schema,
): z.infer<typeof schema> {
  return schema.parse(
    Object.fromEntries(
      Object.entries(schema.shape).map(([key, value]) => {
        switch (value.constructor) {
          case z.ZodDefault:
            return [key, value.def.defaultValue as string];
          case z.ZodString:
            return [key, ""];
          case z.ZodNumber:
            return [key, 0];
          default:
            return [key, ""];
        }
      }),
    ),
  );
}
