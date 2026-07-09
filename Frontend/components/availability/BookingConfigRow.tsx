import { SelectRow, type SelectOption } from "@/components/ui";

function minuteOptions(values: number[]): SelectOption[] {
  return values.map((m) => ({
    value: String(m),
    label: m < 60 ? `${m} min` : `${m / 60}h${m % 60 ? ` ${m % 60}m` : ""}`,
  }));
}

export const DURATION_OPTIONS = minuteOptions([30, 60, 90, 120, 180, 240, 300, 360, 480]);
export const BUFFER_OPTIONS = minuteOptions([0, 15, 30, 45, 60, 90, 120]).map((o) =>
  o.value === "0" ? { ...o, label: "None" } : o
);

export type BookingConfigRowProps = {
  label: string;
  value: number;
  options: SelectOption[];
  onChange: (minutes: number) => void;
};

/** One labeled duration dropdown (min / max / buffer). */
export function BookingConfigRow({ label, value, options, onChange }: BookingConfigRowProps) {
  return (
    <SelectRow
      label={label}
      value={String(value)}
      options={options}
      onChange={(v) => onChange(Number(v))}
    />
  );
}
