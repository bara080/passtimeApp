import { useState } from "react";
import { View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { ScreenHeader, AppButton } from "@/components/ui";
import { PhotoGrid, type PhotoEntry } from "@/components/onboarding/PhotoGrid";
import { mediaApi } from "@/services/media";
import { useSaveHostOnboarding } from "@/services/host/hooks";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/context/ToastProvider";
import { trackEvent, trackError } from "@/utils/analytics";

const MIN_PHOTOS = 2;
const MAX_PHOTOS = 9;

export default function HostPhotosRoute() {
  const router = useRouter();
  const toast = useToast();
  const save = useSaveHostOnboarding();
  const { updateUser } = useAuth();
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [uploading, setUploading] = useState(false);

  const addPhoto = async () => {
    if (photos.length >= MAX_PHOTOS || uploading) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]?.uri) return;

    setUploading(true);
    trackEvent("host_onboarding.photo.upload_start", { count: photos.length + 1 });
    try {
      const entry = await mediaApi.uploadImageWithPath("photo", result.assets[0].uri);
      setPhotos((prev) => [...prev, entry]);
      trackEvent("host_onboarding.photo.upload_success", { count: photos.length + 1 });
    } catch (err) {
      trackError("host_onboarding.photo.upload", err);
      toast.error("Upload failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    try {
      // Terminal step: "done" flips hostOnboardingComplete on the server.
      await save.mutateAsync({ photos, step: "done" });
      // Sync local session so the route guard doesn't yank the host back into
      // onboarding on the next navigation (it reads session.user, not the
      // React Query cache that useSaveHostOnboarding invalidates).
      await updateUser({ hostOnboardingComplete: true, hostOnboardingStep: "done" });
      router.replace({
        pathname: "/(auth)/success",
        params: {
          title: "Success",
          message: "Your business profile has been successfully created.",
          buttonLabel: "Go to Dashboard",
          // Host home is the dashboard tab, not the member "/(app)" index.
          next: "/(app)/dashboard",
        },
      });
    } catch (err) {
      toast.error("Could not save", err instanceof Error ? err.message : "Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <View className="flex-1 px-[21px] pb-8">
        <ScreenHeader
          title="Profile Pictures"
          subtitle="At least two photos/videos are required here."
        />
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <PhotoGrid
            photos={photos}
            maxPhotos={MAX_PHOTOS}
            uploading={uploading}
            onAdd={addPhoto}
            onRemove={removePhoto}
          />
        </ScrollView>
        <AppButton
          label="Confirm & Submit"
          onPress={submit}
          loading={save.isPending}
          disabled={photos.length < MIN_PHOTOS || uploading}
        />
      </View>
    </SafeAreaView>
  );
}
