import { useMemo, useState } from "react";
import { View, Text, Pressable, Modal, FlatList } from "react-native";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { GradientButton } from "./GradientButton";

export type DateFieldProps = {
  label: string;
  /** ISO date string "YYYY-MM-DD" or empty. */
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  error?: string;
  /** Initial decade shown when empty; defaults to 25 years ago (adult DOB). */
  initialYearOffset?: number;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatDisplay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** Labeled date field with calendar icon opening a pure-JS calendar modal (no native module). */
export function DateField({
  label,
  value,
  onChange,
  placeholder = "Select birth date",
  error,
  initialYearOffset = 25,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const { palette } = useThemeColors();
  const today = new Date();
  const initial = value
    ? new Date(value)
    : new Date(today.getFullYear() - initialYearOffset, 0, 1);

  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [selected, setSelected] = useState<string>(value);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);

  const years = useMemo(() => {
    const max = today.getFullYear();
    return Array.from({ length: 100 }, (_, i) => max - i);
  }, [today]);

  const grid = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const total = daysInMonth(viewYear, viewMonth);
    return [...Array(firstWeekday).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  }, [viewYear, viewMonth]);

  const navMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const isoFor = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const confirm = () => {
    if (selected) onChange(selected);
    setOpen(false);
  };

  return (
    <View className="mb-5">
      <Text className="text-base text-black dark:text-white mb-2">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatDisplay(value) : placeholder}`}
        className={`h-[52px] bg-white dark:bg-[#1a1a1a] border rounded-[8px] px-4 flex-row items-center justify-between ${
          error ? "border-red-500" : "border-[#d1d5dc] dark:border-[#333333]"
        }`}
      >
        <Text className={`text-base ${value ? "text-[#1a1a1a] dark:text-white" : "text-[#aaa] dark:text-[#777]"}`}>
          {value ? formatDisplay(value) : placeholder}
        </Text>
        <Calendar size={20} color={palette.textPrimary} />
      </Pressable>
      {error ? <Text className="text-sm text-red-500 mt-1">{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40 justify-center px-[21px]" onPress={() => setOpen(false)}>
          <Pressable className="bg-white dark:bg-[#1a1a1a] rounded-[16px] p-5" onPress={() => {}}>
            {/* Month / year header */}
            <View className="flex-row items-center justify-between mb-3">
              <Pressable onPress={() => navMonth(-1)} hitSlop={10} accessibilityLabel="Previous month">
                <ChevronLeft size={22} color={palette.textPrimary} />
              </Pressable>
              <Pressable onPress={() => setYearPickerOpen((v) => !v)} accessibilityRole="button">
                <Text className="text-base text-[#1a1a1a] dark:text-white">
                  {MONTHS[viewMonth]} <Text className="text-[#ff6633]">{viewYear} ▾</Text>
                </Text>
              </Pressable>
              <Pressable onPress={() => navMonth(1)} hitSlop={10} accessibilityLabel="Next month">
                <ChevronRight size={22} color={palette.textPrimary} />
              </Pressable>
            </View>

            {yearPickerOpen ? (
              <FlatList
                data={years}
                keyExtractor={(y) => String(y)}
                style={{ height: 240 }}
                renderItem={({ item: y }) => (
                  <Pressable
                    onPress={() => {
                      setViewYear(y);
                      setYearPickerOpen(false);
                    }}
                    className="py-2 items-center"
                  >
                    <Text className={`text-base ${y === viewYear ? "text-[#ff6633]" : "text-[#1a1a1a] dark:text-white"}`}>{y}</Text>
                  </Pressable>
                )}
              />
            ) : (
              <>
                <View className="flex-row mb-1">
                  {WEEKDAYS.map((w, i) => (
                    <Text key={i} className="flex-1 text-center text-xs text-[#999]">
                      {w}
                    </Text>
                  ))}
                </View>
                <View className="flex-row flex-wrap">
                  {grid.map((day, i) => {
                    const iso = day ? isoFor(day) : "";
                    const isSelected = !!day && iso === selected;
                    const isFuture = !!day && new Date(iso) > today;
                    return (
                      <Pressable
                        key={i}
                        disabled={!day || isFuture}
                        onPress={() => day && setSelected(iso)}
                        style={{ width: `${100 / 7}%` }}
                        className="h-10 items-center justify-center"
                      >
                        {day ? (
                          <View
                            className={`w-9 h-9 rounded-full items-center justify-center ${isSelected ? "bg-[#ff6633]" : ""}`}
                          >
                            <Text
                              className={`text-base ${isSelected ? "text-white" : isFuture ? "text-[#ccc] dark:text-[#555]" : "text-[#1a1a1a] dark:text-white"}`}
                            >
                              {day}
                            </Text>
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            <View className="mt-4">
              <GradientButton label="Done" onPress={confirm} disabled={!selected} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
