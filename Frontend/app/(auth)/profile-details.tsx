import { useState } from "react";
import { Alert, View } from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { AuthScreen, AuthTitle, FormField, GradientButton, AvatarPicker, DateField } from "@/components/auth";
import { useUpdateProfileMutation } from "@/hooks/useUpdateProfile";
import { useAvatarUploadMutation } from "@/hooks/useAvatarUpload";
import { useAuth } from "@/context/AuthProvider";
import { validateName, validateDateOfBirthIso } from "@/utils/validation";

export default function ProfileDetailsScreen() {
  const { updateUser } = useAuth();
  const updateProfile = useUpdateProfileMutation();
  const avatarUpload = useAvatarUploadMutation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; dob?: string }>({});

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to add a profile photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const localUri = result.assets[0].uri;
    setAvatarUri(localUri);
    try {
      const url = await avatarUpload.mutateAsync(localUri);
      await updateUser({ avatarUrl: url });
    } catch (err: unknown) {
      setAvatarUri(null);
      Alert.alert("Upload failed", err instanceof Error ? err.message : "Please try again.");
    }
  };

  const handleSubmit = async () => {
    const nextErrors = {
      firstName: validateName(firstName, "First name") ?? undefined,
      lastName: validateName(lastName, "Last name") ?? undefined,
      dob: validateDateOfBirthIso(dob),
    };
    setErrors(nextErrors);
    if (nextErrors.firstName || nextErrors.lastName || nextErrors.dob) return;

    try {
      const user = await updateProfile.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dob,
      });
      await updateUser({
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        dateOfBirth: user.dateOfBirth,
      });
      router.replace({
        pathname: "/(auth)/success",
        params: {
          title: "Thank you",
          message: "Your profile has been successfully created to Passtime.",
          buttonLabel: "Explore Passtime",
          next: "/(app)",
        },
      });
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Could not save your profile.");
    }
  };

  return (
    <AuthScreen showBack={false}>
      <AuthTitle title="Profile details" />

      <View className="flex-1 justify-center">
        <AvatarPicker uri={avatarUri} onPick={pickAvatar} />
        <FormField
          label="First Name"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          autoComplete="given-name"
          error={errors.firstName}
        />
        <FormField
          label="Last Name"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          autoComplete="family-name"
          error={errors.lastName}
        />
        <DateField label="Date of Birth" value={dob} onChange={setDob} error={errors.dob} />
      </View>

      <GradientButton label="Submit" onPress={handleSubmit} loading={updateProfile.isPending} />
    </AuthScreen>
  );
}
