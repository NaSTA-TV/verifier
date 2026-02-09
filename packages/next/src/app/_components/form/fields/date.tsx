import { DateInput } from "@mantine/dates";
import { useStore } from "@tanstack/react-form";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useFieldContext } from "../context";

dayjs.extend(customParseFormat);

export function DateField({ label }: { label: string }) {
  const field = useFieldContext<string>();

  const errors = useStore(field.store, (state) => state.meta.errors);

  return (
    <DateInput
      // defaultValue={field.state.value}
      error={
        errors.length > 0
          ? errors.map((error: string) => (
              <div key={error} style={{ color: "red" }}>
                {error}
              </div>
            ))
          : undefined
      }
      label={label}
      onBlur={field.handleBlur}
      onChange={(e) => field.handleChange(e ?? "")}
      value={field.state.value}
      valueFormat="YYYY-MM-DD"
    />
  );
}
