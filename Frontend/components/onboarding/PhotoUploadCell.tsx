import { Pressable, Image, ActivityIndicator, View } from "react-native";
import { CloudUpload, X } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { IconButton } from "@/components/ui";

export type PhotoUploadCellProps = {
  /** Remote or local preview URI; empty cell when absent. */
  uri?: string | null;
  uploading?: boolean;
  onAdd: () => void;
  onRemove?: () => void;
};

/** One cell of the photo grid: dashed upload placeholder, spinner, or thumbnail with remove. */
export function PhotoUploadCell({ uri, uploading, onAdd, onRemove }: PhotoUploadCellProps) {
  const { palette } = useThemeColors();

  if (uri) {
    return (
      <View className="rounded-[12px] overflow-hidden" style={{ width: "31%", aspectRatio: 0.78 }}>
        <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        {onRemove ? (
          <View className="absolute top-1 right-1 bg-black/50 rounded-full">
            <IconButton onPress={onRemove} accessibilityLabel="Remove photo">
              <X size={16} color="#ffffff" />
            </IconButton>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onAdd}
      disabled={uploading}
      accessibilityRole="button"
      accessibilityLabel={uploading ? "Uploading photo" : "Upload photo"}
      className="items-center justify-center rounded-[12px] border border-dashed gap-1"
      style={{ width: "31%", aspectRatio: 0.78, borderColor: palette.border }}
    >
      {uploading ? (
        <ActivityIndicator color={palette.accent} />
      ) : (
        <>
          <CloudUpload size={22} color={palette.textMuted} strokeWidth={1.5} />
        </>
      )}
    </Pressable>
  );
}
