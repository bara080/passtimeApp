import { useState } from "react";
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ShieldCheck, IdCard, ScanFace, Lock, Camera, Check, Clock, UserX, CircleCheck } from "lucide-react-native";
import { BackButton } from "@/components/ui/BackButton";
import { GradientButton } from "@/components/auth/GradientButton";
import { useIdentity, useSubmitIdentity } from "@/services/identity/hooks";
import type { DocumentType } from "@/services/identity/types";
import { mediaApi } from "@/services/media";
import { useToast } from "@/context/ToastProvider";
import { useThemeColors } from "@/hooks/useThemeColors";

const DOC_TYPES: { key: DocumentType; label: string }[] = [
  { key: "passport", label: "Passport" },
  { key: "drivers_license", label: "Driver's License" },
  { key: "national_id", label: "National ID" },
];

/** Identity (KYC) verification (Figma 1288:13675 intro, 13880 capture, 14769
 *  rejected). Single status-aware screen: intro → document + selfie upload →
 *  submit; renders pending / verified / rejected states from GET /api/identity. */
export default function IdentityVerificationScreen() {
  const router = useRouter();
  const toast = useToast();
  const { palette, isDark } = useThemeColors();
  const identity = useIdentity();
  const submit = useSubmitIdentity();

  const [started, setStarted] = useState(false);
  const [docType, setDocType] = useState<DocumentType>("passport");
  const [front, setFront] = useState<string | null>(null);
  const [back, setBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [uploading, setUploading] = useState<null | "front" | "back" | "selfie">(null);

  const status = identity.data?.status ?? "unverified";
  const needsBack = docType !== "passport";
  const canSubmit = Boolean(front) && (!needsBack || Boolean(back)) && !submit.isPending;

  const pickAndUpload = async (slot: "front" | "back" | "selfie") => {
    if (uploading) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.info("Permission needed", "Allow photo access to upload your document.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
    if (result.canceled || !result.assets[0]?.uri) return;
    setUploading(slot);
    try {
      const url = await mediaApi.uploadImage("photo", result.assets[0].uri);
      if (slot === "front") setFront(url);
      else if (slot === "back") setBack(url);
      else setSelfie(url);
    } catch (err) {
      toast.error("Upload failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setUploading(null);
    }
  };

  const onSubmit = async () => {
    try {
      await submit.mutateAsync({
        documentType: docType,
        frontUrl: front!,
        backUrl: back ?? undefined,
        selfieUrl: selfie ?? undefined,
      });
      toast.success("Submitted", "Your identity is under review.");
    } catch (err) {
      toast.error("Could not submit", err instanceof Error ? err.message : "Please try again.");
    }
  };

  // ── Terminal / in-progress states ──────────────────────────────────────────
  if (identity.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d] items-center justify-center">
        <ActivityIndicator color={palette.accent} />
      </SafeAreaView>
    );
  }

  if (status === "verified") {
    return (
      <StatusView
        Icon={CircleCheck}
        color="#7cb342"
        heading="Identity verified"
        body="Your identity has been verified. You're all set."
        cta="Done"
        onCta={() => router.back()}
        onBack={() => router.back()}
      />
    );
  }

  if (status === "pending") {
    return (
      <StatusView
        Icon={Clock}
        color={palette.accent}
        heading="Under review"
        body="Thanks — we're reviewing your documents. This usually takes a little while. We'll update your status here."
        cta="Back to profile"
        onCta={() => router.back()}
        onBack={() => router.back()}
      />
    );
  }

  const rejected = status === "rejected";

  // Intro (first-time only; rejected users skip straight to the form to retry).
  if (!started && !rejected) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
        <View className="px-[21px] pt-4 flex-1">
          <BackButton onPress={() => router.back()} />
          <View className="flex-1 items-center justify-center">
            <View
              className="w-[150px] h-[150px] rounded-full items-center justify-center mb-8"
              style={{ backgroundColor: isDark ? "#2a1c14" : "#fff3ec" }}
            >
              <ShieldCheck size={64} color={palette.accent} strokeWidth={1.3} />
            </View>
            <Text className="text-[24px] font-semibold text-center mb-2" style={{ color: palette.textPrimary }}>
              Verifying your identity
            </Text>
            <Text className="text-[15px] text-center leading-[22px] mb-8" style={{ color: palette.textMuted }}>
              Please submit the following documents to process your application.
            </Text>
            <Bullet Icon={IdCard} title="Take a picture of a valid ID" body="To check your personal information is correct" palette={palette} />
            <Bullet Icon={ScanFace} title="Take a selfie of yourself" body="To match your face to your ID photo" palette={palette} />
          </View>
          <View className="flex-row items-center justify-center gap-2 mb-3">
            <Lock size={13} color={palette.textMuted} />
            <Text className="text-[12px]" style={{ color: palette.textMuted }}>
              Your info will be encrypted and stored securely
            </Text>
          </View>
          <View className="pb-4">
            <GradientButton label="Get Started" onPress={() => setStarted(true)} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <ScrollView contentContainerStyle={{ padding: 21, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <BackButton onPress={() => router.back()} />
        <Text className="text-[24px] font-semibold mt-4 mb-1" style={{ color: palette.textPrimary }}>
          Verify your identity
        </Text>
        <Text className="text-[14px] mb-5" style={{ color: palette.textMuted }}>
          Upload a clear photo of your document{needsBack ? " (both sides)" : ""} and a selfie.
        </Text>

        {rejected ? (
          <View className="rounded-[12px] p-3 mb-5 flex-row items-start gap-2" style={{ backgroundColor: isDark ? "#3a1a1a" : "#fdecec" }}>
            <UserX size={18} color="#e5484d" />
            <View className="flex-1">
              <Text className="text-[14px] font-semibold" style={{ color: "#e5484d" }}>
                Verification unsuccessful
              </Text>
              <Text className="text-[13px] mt-0.5" style={{ color: palette.textPrimary }}>
                {identity.data?.rejectionReason || "We couldn't verify your details. Please review and try again."}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Document type */}
        <Text className="text-[14px] font-semibold mb-2" style={{ color: palette.textPrimary }}>
          Document type
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-5">
          {DOC_TYPES.map((d) => {
            const active = docType === d.key;
            return (
              <Pressable
                key={d.key}
                onPress={() => setDocType(d.key)}
                className="px-4 py-2 rounded-full border"
                style={{ backgroundColor: active ? palette.accent : "transparent", borderColor: active ? palette.accent : palette.border }}
              >
                <Text className="text-[13px] font-medium" style={{ color: active ? "#fff" : palette.textPrimary }}>
                  {d.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Uploads */}
        <UploadTile label="Document front" uri={front} busy={uploading === "front"} onPress={() => pickAndUpload("front")} palette={palette} isDark={isDark} />
        {needsBack ? (
          <UploadTile label="Document back" uri={back} busy={uploading === "back"} onPress={() => pickAndUpload("back")} palette={palette} isDark={isDark} />
        ) : null}
        <UploadTile label="Selfie (optional)" uri={selfie} busy={uploading === "selfie"} onPress={() => pickAndUpload("selfie")} palette={palette} isDark={isDark} />

        <View className="mt-6">
          <GradientButton label="Submit for review" onPress={onSubmit} loading={submit.isPending} disabled={!canSubmit} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type Pal = { accent: string; textPrimary: string; textMuted: string; border: string; surface: string };

function Bullet({ Icon, title, body, palette }: { Icon: typeof IdCard; title: string; body: string; palette: Pal }) {
  return (
    <View className="flex-row items-start gap-3 w-full mb-4 px-2">
      <Icon size={22} color={palette.textPrimary} />
      <View className="flex-1">
        <Text className="text-[15px] font-medium" style={{ color: palette.textPrimary }}>
          {title}
        </Text>
        <Text className="text-[13px] mt-0.5" style={{ color: palette.textMuted }}>
          {body}
        </Text>
      </View>
    </View>
  );
}

function UploadTile({ label, uri, busy, onPress, palette, isDark }: { label: string; uri: string | null; busy: boolean; onPress: () => void; palette: Pal; isDark: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={`Upload ${label}`}
      className="h-[92px] rounded-[12px] border border-dashed mb-3 flex-row items-center px-4 gap-3"
      style={{ borderColor: uri ? palette.accent : palette.border, backgroundColor: palette.surface }}
    >
      {uri ? (
        <Image source={{ uri }} className="w-16 h-16 rounded-[8px]" />
      ) : (
        <View className="w-16 h-16 rounded-[8px] items-center justify-center" style={{ backgroundColor: isDark ? "#1a1a1a" : "#f4f4f5" }}>
          {busy ? <ActivityIndicator color={palette.accent} /> : <Camera size={24} color={palette.textMuted} />}
        </View>
      )}
      <View className="flex-1">
        <Text className="text-[14px] font-medium" style={{ color: palette.textPrimary }}>
          {label}
        </Text>
        <Text className="text-[12px] mt-0.5" style={{ color: uri ? "#7cb342" : palette.textMuted }}>
          {busy ? "Uploading…" : uri ? "Uploaded" : "Tap to upload"}
        </Text>
      </View>
      {uri ? <Check size={20} color="#7cb342" /> : null}
    </Pressable>
  );
}

function StatusView({
  Icon,
  color,
  heading,
  body,
  cta,
  onCta,
  onBack,
}: {
  Icon: typeof Clock;
  color: string;
  heading: string;
  body: string;
  cta: string;
  onCta: () => void;
  onBack: () => void;
}) {
  const { palette } = useThemeColors();
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <View className="px-[21px] pt-4 flex-1">
        <BackButton onPress={onBack} />
        <View className="flex-1 items-center justify-center">
          <Icon size={72} color={color} strokeWidth={1.5} />
          <Text className="text-[22px] font-semibold text-center mt-6 mb-2" style={{ color }}>
            {heading}
          </Text>
          <Text className="text-[15px] text-center leading-[22px] px-4" style={{ color: palette.textMuted }}>
            {body}
          </Text>
        </View>
        <View className="pb-4">
          <GradientButton label={cta} onPress={onCta} />
        </View>
      </View>
    </SafeAreaView>
  );
}
