import { View, Pressable, Image, Alert } from "react-native";
import { User, Camera } from "lucide-react-native";

export type AvatarPickerProps = {
  /** Local or remote image URI; placeholder silhouette when absent. */
  uri?: string | null;
  /** Called with the picked image URI. When omitted, tapping explains upload is coming soon. */
  onPick?: () => void;
};

/** Rounded avatar box with a green camera badge (Figma 1288:5544). Upload backend pending. */
export function AvatarPicker({ uri, onPick }: AvatarPickerProps) {
  const handlePress =
    onPick ?? (() => Alert.alert("Coming soon", "Profile photo upload is not available yet."));

  return (
    <View className="items-center mb-8">
      <Pressable onPress={handlePress} accessibilityRole="button" accessibilityLabel="Add profile photo">
        <View className="w-[132px] h-[132px] rounded-[20px] bg-[#f7f5f2] dark:bg-[#f4f4f5] items-center justify-center overflow-hidden">
          {uri ? (
            <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <User size={72} color="#c9beb2" strokeWidth={1.2} />
          )}
        </View>
        <View className="absolute -bottom-2 -right-2 w-[44px] h-[44px] rounded-full bg-[#8bc34a] items-center justify-center border-[3px] border-white dark:border-[#0d0d0d]">
          <Camera size={20} color="#fff" />
        </View>
      </Pressable>
    </View>
  );
}
