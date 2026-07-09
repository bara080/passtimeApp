import { useState } from "react";
import { View, Text, Pressable, Modal, FlatList } from "react-native";
import { ChevronDown, Trash2, Check } from "lucide-react-native";
import { IconButton } from "@/components/ui";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { TimeRange } from "@/services/host/types";

/** 30-minute steps, 00:00–23:30. */
export const TIME_OPTIONS: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  return `${h}:${i % 2 ? "30" : "00"}`;
});

export type TimeRangeRowProps = {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  onRemove?: () => void;
};

/** Inline `[start ▾] – [end ▾] [🗑]` row. */
export function TimeRangeRow({ value, onChange, onRemove }: TimeRangeRowProps) {
  const { palette } = useThemeColors();

  return (
    <View className="flex-row items-center gap-2 mt-2">
      <TimePill value={value.start} onSelect={(start) => onChange({ ...value, start })} label="Start time" />
      <Text style={{ color: palette.textMuted }}>–</Text>
      <TimePill value={value.end} onSelect={(end) => onChange({ ...value, end })} label="End time" />
      {onRemove ? (
        <IconButton onPress={onRemove} accessibilityLabel="Remove time range">
          <Trash2 size={16} color={palette.textMuted} />
        </IconButton>
      ) : null}
    </View>
  );
}

/** Internal compact time selector opening a themed sheet. */
function TimePill({ value, onSelect, label }: { value: string; onSelect: (t: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const { palette } = useThemeColors();

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        className="flex-row items-center gap-1 border rounded-[8px] px-3 h-9 bg-white dark:bg-[#1a1a1a]"
        style={{ borderColor: palette.border }}
      >
        <Text className="text-sm" style={{ color: palette.textPrimary }}>
          {value}
        </Text>
        <ChevronDown size={14} color={palette.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setOpen(false)}>
          <Pressable className="bg-white dark:bg-[#1a1a1a] rounded-t-[16px] px-5 pt-5 pb-8 max-h-[55%]" onPress={() => {}}>
            <Text className="text-base font-semibold text-[#1a1a1a] dark:text-white mb-3">{label}</Text>
            <FlatList
              data={TIME_OPTIONS}
              keyExtractor={(t) => t}
              initialScrollIndex={Math.max(0, TIME_OPTIONS.indexOf(value) - 3)}
              getItemLayout={(_, index) => ({ length: 44, offset: 44 * index, index })}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                  className="h-11 flex-row items-center justify-between"
                >
                  <Text className="text-base text-[#1a1a1a] dark:text-white">{item}</Text>
                  {item === value ? <Check size={18} color={palette.accent} /> : null}
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
