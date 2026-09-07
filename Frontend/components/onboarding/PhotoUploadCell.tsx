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

/** One cell of the photo grid: dashed upload placeholder, spinner, or thumbnail with remove.
 *
 * Every cell — filled OR empty — is sized by the SAME outer View (width 31% + aspectRatio),
 * so all nine cards are identical in size. Previously the empty cells put aspectRatio on the
 * Pressable, which collapsed them short (icon bottom-pinned) and left the grid uneven whenever
 * some photos were uploaded. The inner content just fills the box with flex-1. */
export function PhotoUploadCell({ uri, uploading, onAdd, onRemove }: PhotoUploadCellProps) {
  const { palette } = useThemeColors();

  return (
    <View style={{ width: "31%", aspectRatio: 0.78 }}>
      {uri ? (
        <View className="flex-1 rounded-[12px] overflow-hidden">
          <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          {onRemove ? (
            <View className="absolute top-1 right-1 bg-black/50 rounded-full">
              <IconButton onPress={onRemove} accessibilityLabel="Remove photo">
                <X size={16} color="#ffffff" />
              </IconButton>
            </View>
          ) : null}
        </View>
      ) : (
        <Pressable
          onPress={onAdd}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel={uploading ? "Uploading photo" : "Upload photo"}
          className="flex-1 rounded-[12px] border border-dashed"
          style={{ borderColor: palette.border, alignItems: "center", justifyContent: "center" }}
        >
          {uploading ? (
            <ActivityIndicator color={palette.accent} />
          ) : (
            <CloudUpload size={22} color={palette.textMuted} strokeWidth={1.5} />
          )}
        </Pressable>
      )}
    </View>
  );
}
