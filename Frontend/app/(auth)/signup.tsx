import { View, Text, Pressable, Image } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";

const memberImg = require("@/assets/member .png");
const hostImg = require("@/assets/host.png");

const ROLES = [
  {
    role: "member" as const,
    title: "Member",
    subtitle: "Discover and book experiences near you",
    image: memberImg,
  },
  {
    role: "host" as const,
    title: "Host",
    subtitle: "List activities and earn from your space",
    image: hostImg,
  },
];

export default function SignupScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-[21px] pt-[79px] pb-8">
        <Pressable onPress={() => router.back()} className="mb-6">
          <ArrowLeft size={24} color="#1a1a1a" />
        </Pressable>

        <Text style={{ fontSize: 26, fontWeight: "600", color: "#1a1a1a", marginBottom: 6 }}>
          Join Passtime
        </Text>
        <Text style={{ fontSize: 16, color: "#666", marginBottom: 32 }}>
          Choose how you want to get started
        </Text>

        <View style={{ gap: 16 }}>
          {ROLES.map(({ role, title, subtitle, image }) => (
            <Pressable
              key={role}
              onPress={() =>
                router.push({
                  pathname: "/(auth)/register",
                  params: { role },
                })
              }
              style={{
                borderWidth: 1,
                borderColor: "#d1d5dc",
                borderRadius: 16,
                overflow: "hidden",
                backgroundColor: "#fafafa",
              }}
            >
              <Image
                source={image}
                style={{ width: "100%", height: 160 }}
                resizeMode="cover"
              />
              <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: "600", color: "#1a1a1a" }}>{title}</Text>
                <Text style={{ fontSize: 14, color: "#666", marginTop: 4 }}>{subtitle}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 32, gap: 4 }}>
          <Text style={{ fontSize: 16, color: "#666" }}>Already have an account?</Text>
          <Pressable onPress={() => router.push("/(auth)/login")}>
            <Text style={{ fontSize: 16, color: "#ff6633", textDecorationLine: "underline" }}>
              Sign in
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
