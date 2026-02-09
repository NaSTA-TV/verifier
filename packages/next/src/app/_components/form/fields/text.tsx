import { TextInput } from "@mantine/core";
import { useFieldContext } from "../context";

export function TextField({ label }: { label: string }) {
  const field = useFieldContext<string>();

  // const errors: ZodError[] = useStore(
  // 	field.store,
  // 	(state) => state.meta.errors,
  // );

  return (
    <TextInput
      error={
        field.state.meta.isTouched && !field.state.meta.isValid ? (
          <em>{field.state.meta.errors.map((err) => err.message).join(",")}</em>
        ) : null
      }
      label={label}
      onBlur={field.handleBlur}
      onChange={(e) => field.handleChange(e.currentTarget.value)}
      value={field.state.value}
    />
  );
}
