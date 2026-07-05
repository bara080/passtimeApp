import { useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { router } from "expo-router";
import { AuthScreen, AuthTitle, GradientButton } from "@/components/auth";
import { colors } from "@/constants/theme";
import type { UserRole } from "@/services/auth/types";

const ROLES: { role: UserRole; title: string; description: string; image: number }[] = [
  {
    role: "member",
    title: "Member",
    description: "Find verified members and schedule structured experiences.",
    image: require("@/assets/auth/role-member.png"),
  },
  {
    role: "host",
    title: "Host",
    description: "Create a profile, set your availability, and receive booking requests.",
    image: require("@/assets/auth/role-host.png"),
  },
];

export default function SignupScreen() {
  const [selected, setSelected] = useState<UserRole>("member");

  return (
    <AuthScreen scroll={false}>
      <AuthTitle
        title="How Would You Like to Join?"
        description="Passtime is built for both members and verified hosts. Choose how you want to participate."
      />

      <View className="flex-1 justify-center gap-4">
        {ROLES.map(({ role, title, description, image }) => {
          const isSelected = selected === role;
          return (
            <Pressable
              key={role}
              onPress={() => setSelected(role)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              className="flex-row items-center rounded-[12px] border p-4 gap-4"
              style={{
                borderColor: isSelected ? colors.accent : colors.border,
                backgroundColor: isSelected ? "#fff3ec" : "#ffffff",
              }}
            >
              <Image source={image} style={{ width: 72, height: 72 }} resizeMode="contain" />
              <View className="flex-1">
                <Text className="text-[20px] text-[#1a1a1a] mb-1">{title}</Text>
                <Text className="text-sm text-[#444] leading-[19px]">{description}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <GradientButton
        label="Continue"
        onPress={() => router.push({ pathname: "/(auth)/register", params: { role: selected } })}
      />
    </AuthScreen>
  );
}
