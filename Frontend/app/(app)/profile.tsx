import { useState } from "react";
import { View, Text, Pressable, ScrollView, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { mediaApi } from "@/services/media";
import { authApi } from "@/services/auth";
import {
  LogOut,
  UserCog,
  ClipboardList,
  Receipt,
  ShieldCheck,
  Landmark,
  KeyRound,
  Lock,
  FileText,
  Info,
  Star,
  LifeBuoy,
  Heart,
  CreditCard,
} from "lucide-react-native";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/context/ToastProvider";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useHostDashboard } from "@/services/hostDashboard/hooks";
import { useMyBookings } from "@/services/bookings/hooks";
import {
  HostProfileCover,
  HostProfileStats,
  ProfileSection,
  ProfileRow,
  HostProfilePreferences,
} from "@/components/hostProfile";
import { MemberProfileStats } from "@/components/memberProfile";

const APP_VERSION = "1.0.0";
const MARKETING = "https://passtimeapp.com";

export default function ProfileScreen() {
  const { user } = useAuth();
  if (user?.role === "host") return <HostProfileScreen />;
  return <MemberProfileScreen />;
}

/** Comprehensive host profile — Figma 1288:16092. v1 (unverified) and v2
 *  (verified) render off a single tree; the identity + bank rows swap their
 *  badge state, and the "Your profile" row label follows the verified flag. */
function HostProfileScreen() {
  const router = useRouter();
  const toast = useToast();
  const { user, signOut, updateUser } = useAuth();
  const { palette, isDark } = useThemeColors();
  const dashboard = useHostDashboard(Boolean(user && user.role === "host"));
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const displayName =
    user?.displayName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Host";

  const verified = Boolean(
    user?.emailVerified && user?.phoneVerified && user?.hostOnboardingComplete
  );

  // Effective avatar: user's explicit avatarUrl wins, else fall back to the
  // first host onboarding photo returned by the dashboard endpoint.
  const effectiveAvatar =
    user?.avatarUrl || dashboard.data?.hostProfile?.firstPhotoUrl || undefined;

  const stats = {
    bookingsCompleted: dashboard.data?.performance.acceptedBookings ?? 0,
    lifetimeEarningsCents: dashboard.data?.earnings.thisMonth ?? 0,
    holdMoneyCents: 0,
  };

  const pickAvatar = async () => {
    if (uploadingAvatar) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.info("Permission needed", "Allow photo access to change your avatar.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]?.uri) return;

    setUploadingAvatar(true);
    try {
      const url = await mediaApi.uploadImage("avatar", result.assets[0].uri);
      await authApi.updateProfile({ avatarUrl: url });
      await updateUser({ avatarUrl: url });
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error("Upload failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const openUpdateProfile = () => router.push("/(auth)/host/career" as unknown as Href);
  const soon = (title: string, body: string) => () => toast.info(title, body);
  const openUrl = (url: string) => () => {
    Linking.openURL(url).catch(() => toast.error("Could not open link", "Please try again."));
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]" edges={["top"]}>
      <ScrollView
        className="flex-1 px-[18px] pt-2"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <HostProfileCover
          displayName={displayName}
          email={user?.email || ""}
          phoneNumber={user?.phoneNumber}
          avatarUrl={effectiveAvatar}
          verified={verified}
          onPickAvatar={pickAvatar}
          uploadingAvatar={uploadingAvatar}
        />

        <HostProfileStats {...stats} />

        <ProfileSection title="General">
          <ProfileRow
            Icon={UserCog}
            label={verified ? "Your profile" : "Update profile"}
            onPress={openUpdateProfile}
          />
          <Divider />
          <ProfileRow
            Icon={ClipboardList}
            label="Bookings history"
            onPress={soon("Coming soon", "Bookings history arrives in a follow-up build.")}
          />
          <Divider />
          <ProfileRow
            Icon={Receipt}
            label="Transactions history"
            onPress={soon("Coming soon", "Transactions ledger arrives with payouts.")}
          />
          <Divider />
          <ProfileRow
            Icon={ShieldCheck}
            label="Identity verification"
            badge="coming_soon"
            onPress={soon("Coming soon", "ID document verification arrives shortly.")}
          />
          <Divider />
          <ProfileRow
            Icon={Landmark}
            label="Bank accounts"
            badge="coming_soon"
            onPress={soon("Coming soon", "Stripe payouts setup arrives shortly.")}
          />
          <Divider />
          <ProfileRow
            Icon={KeyRound}
            label="Change Password"
            onPress={() => router.push("/(auth)/forgot-password" as unknown as Href)}
          />
        </ProfileSection>

        <ProfileSection title="More">
          <ProfileRow Icon={Lock} label="Privacy Policy" onPress={openUrl(`${MARKETING}/privacy`)} />
          <Divider />
          <ProfileRow Icon={FileText} label="Terms of Use" onPress={openUrl(`${MARKETING}/terms`)} />
          <Divider />
          <ProfileRow Icon={Info} label="Know about Passtime" onPress={openUrl(MARKETING)} />
          <Divider />
          <ProfileRow
            Icon={Star}
            label="Rate app"
            onPress={soon("Thanks", "Store rating link arrives after store submission.")}
          />
          <Divider />
          <ProfileRow
            Icon={LifeBuoy}
            label="Help & Support"
            onPress={openUrl(`${MARKETING}/support`)}
          />
        </ProfileSection>

        <HostProfilePreferences country="United States" currency="USD" />

        <Text className="text-[11px] text-center mb-6" style={{ color: palette.textMuted }}>
          Version {APP_VERSION}
        </Text>

        <Pressable
          onPress={signOut}
          className="h-[52px] rounded-[10px] border flex-row items-center justify-center gap-2"
          style={{ borderColor: palette.border, backgroundColor: isDark ? palette.surface : "#ffffff" }}
        >
          <LogOut size={20} color={palette.textMuted} />
          <Text className="text-base font-medium" style={{ color: palette.textSecondary }}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Divider() {
  const { palette } = useThemeColors();
  return <View className="h-px ml-[52px]" style={{ backgroundColor: palette.border }} />;
}

/** Comprehensive member profile — mirrors the host layout so members and hosts
 *  share the same visual grammar. Verified badge only shows when both email and
 *  phone are verified; the "coming soon" badges gate features not yet built. */
function MemberProfileScreen() {
  const router = useRouter();
  const toast = useToast();
  const { user, signOut, updateUser } = useAuth();
  const { palette, isDark } = useThemeColors();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const upcoming = useMyBookings("upcoming");
  const past = useMyBookings("past");

  const displayName =
    user?.displayName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Member";
  const verified = Boolean(user?.emailVerified && user?.phoneVerified);

  const pickAvatar = async () => {
    if (uploadingAvatar) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.info("Permission needed", "Allow photo access to change your avatar.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]?.uri) return;

    setUploadingAvatar(true);
    try {
      const url = await mediaApi.uploadImage("avatar", result.assets[0].uri);
      await authApi.updateProfile({ avatarUrl: url });
      await updateUser({ avatarUrl: url });
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error("Upload failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const soon = (title: string, body: string) => () => toast.info(title, body);
  const openUrl = (url: string) => () => {
    Linking.openURL(url).catch(() => toast.error("Could not open link", "Please try again."));
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]" edges={["top"]}>
      <ScrollView
        className="flex-1 px-[18px] pt-2"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <HostProfileCover
          displayName={displayName}
          email={user?.email || ""}
          phoneNumber={user?.phoneNumber}
          avatarUrl={user?.avatarUrl}
          verified={verified}
          onPickAvatar={pickAvatar}
          uploadingAvatar={uploadingAvatar}
        />

        <MemberProfileStats
          upcoming={upcoming.data?.length ?? 0}
          completed={past.data?.length ?? 0}
          favorites={0}
        />

        <ProfileSection title="General">
          <ProfileRow
            Icon={UserCog}
            label="Personal details"
            onPress={() => router.push("/(auth)/profile-details" as unknown as Href)}
          />
          <Divider />
          <ProfileRow
            Icon={ClipboardList}
            label="My bookings"
            onPress={() => router.push("/(app)/bookings" as unknown as Href)}
          />
          <Divider />
          <ProfileRow
            Icon={Heart}
            label="Favorites"
            onPress={() => router.push("/(app)/likes" as unknown as Href)}
          />
          <Divider />
          <ProfileRow
            Icon={CreditCard}
            label="Payment methods"
            badge="coming_soon"
            onPress={soon("Coming soon", "Saved cards and payout preferences arrive shortly.")}
          />
          <Divider />
          <ProfileRow
            Icon={ShieldCheck}
            label="Identity verification"
            badge="coming_soon"
            onPress={soon("Coming soon", "ID document verification arrives shortly.")}
          />
          <Divider />
          <ProfileRow
            Icon={KeyRound}
            label="Change Password"
            onPress={() => router.push("/(auth)/forgot-password" as unknown as Href)}
          />
        </ProfileSection>

        <ProfileSection title="More">
          <ProfileRow Icon={Lock} label="Privacy Policy" onPress={openUrl(`${MARKETING}/privacy`)} />
          <Divider />
          <ProfileRow Icon={FileText} label="Terms of Use" onPress={openUrl(`${MARKETING}/terms`)} />
          <Divider />
          <ProfileRow Icon={Info} label="Know about Passtime" onPress={openUrl(MARKETING)} />
          <Divider />
          <ProfileRow
            Icon={Star}
            label="Rate app"
            onPress={soon("Thanks", "Store rating link arrives after store submission.")}
          />
          <Divider />
          <ProfileRow
            Icon={LifeBuoy}
            label="Help & Support"
            onPress={openUrl(`${MARKETING}/support`)}
          />
        </ProfileSection>

        <HostProfilePreferences country="United States" currency="USD" />

        <Text className="text-[11px] text-center mb-6" style={{ color: palette.textMuted }}>
          Version {APP_VERSION}
        </Text>

        <Pressable
          onPress={signOut}
          className="h-[52px] rounded-[10px] border flex-row items-center justify-center gap-2"
          style={{ borderColor: palette.border, backgroundColor: isDark ? palette.surface : "#ffffff" }}
        >
          <LogOut size={20} color={palette.textMuted} />
          <Text className="text-base font-medium" style={{ color: palette.textSecondary }}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
