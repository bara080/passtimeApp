import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";

const LOGO_MARK_SVG = `<svg width="97.333" height="65.7983" viewBox="0 0 97.333 65.7983" fill="none" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="mark_grad" x1="43.6635" y1="41.0393" x2="60.7481" y2="-9.74036" gradientUnits="userSpaceOnUse">
    <stop stop-color="#FF6833"/>
    <stop offset="0.878431" stop-color="#FFB300"/>
    <stop offset="1" stop-color="#FCA311"/>
  </linearGradient>
</defs>
<path fill-rule="evenodd" clip-rule="evenodd" d="M21.5998 9.9951C30.5632 8.03221 39.7124 14.2393 39.7885 23.6856C39.8651 33.1644 30.7511 39.56 21.7381 37.6458C16.6703 36.5695 14.5591 32.6404 10.498 32.5781C5.99619 32.509 3.62446 36.8796 2.15203 40.5434C-0.336043 46.7344 0.0196511 48.1783 0.0152889 54.7924C0.0119598 59.4383 0.17078 64.0096 5.65996 65.4502C10.0395 66.5994 14.8366 64.4473 15.866 59.8302C16.6913 56.1296 14.1086 46.8725 19.3852 47.0551C22.1243 47.1499 24.045 47.7924 27.073 47.4985C29.5005 47.2629 31.5315 46.898 33.8137 46.0878C41.4009 43.3945 47.6199 37.0939 49.4156 29.0848C50.0052 26.4547 50.1117 24.259 49.9174 21.6085C49.7935 19.921 48.2416 15.9063 49.4706 15.1654C49.8734 14.9225 55.9573 15.3669 57.074 15.3669C61.4406 15.3669 61.2326 14.9679 61.2326 19.3594V51.9643C61.2329 56.4364 60.7405 61.6211 64.9525 64.5469C68.9272 67.308 73.467 65.1777 75.64 61.2978C78.0293 57.031 77.5351 51.623 77.5351 46.8904C77.5351 38.7317 78.5723 23.1273 75.7643 16.0565C73.5263 10.4204 65.1747 0.304125 58.8207 0.311816C53.3868 0.318532 47.9522 0.312046 42.518 0.312046C38.7166 0.312046 34.1936 0.169757 30.5194 0.526714C29.9397 0.583193 27.7389 0.146741 26.9446 0.0820538C18.4545 -0.60781 9.4369 3.08338 4.27937 9.98265C1.82539 13.2658 0.0129931 17.8988 0.0125339 22.0183C0.0121321 27.4533 0.0152315 32.8885 0.0152315 38.3235C1.24745 36.1736 2.1141 33.9305 4.09667 32.2574C6.00658 30.6453 8.98702 29.0898 11.5766 29.8394C7.53112 21.3736 12.6613 11.9524 21.5998 9.99499V9.9951Z" fill="url(#mark_grad)"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M66.2229 0.312961C70.8063 3.85808 74.4571 6.98413 77.1756 12.4001C78.9344 15.9042 77.6288 15.3773 81.8596 15.3681C86.1896 15.3587 90.5533 15.2197 93.9423 12.0623C97.5373 8.71283 97.3308 4.72828 97.3308 0.312904H66.223L66.2229 0.312961Z" fill="#71AA00"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M24.7025 25.4529C24.9618 25.4529 25.2087 25.4999 25.4384 25.5861L34.8341 17.2394L26.5988 26.6603C26.7236 26.9284 26.7936 27.2276 26.7936 27.5427C26.7936 28.6967 25.8581 29.6326 24.7033 29.6326C23.549 29.6326 22.6143 28.6967 22.6143 27.5427C22.6143 27.2276 22.6842 26.9284 22.8091 26.6603L14.2265 16.8535L23.9457 25.5945C24.1803 25.5033 24.4357 25.4528 24.7033 25.4528H24.7025L24.7025 25.4529Z" fill="#FF6633"/>
</svg>`;

export default function LandingScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Logo — centered in upper portion */}
      <View className="flex-1 items-center justify-center">
        <SvgXml xml={LOGO_MARK_SVG} width={100} height={68} />
        <View className="flex-row mt-3">
          <Text style={{ fontSize: 42, fontWeight: "700", color: "#1a1a1a", lineHeight: 50 }}>Pass</Text>
          <Text style={{ fontSize: 42, fontWeight: "400", color: "#71aa00", lineHeight: 50 }}>time</Text>
        </View>
      </View>

      {/* CTA section */}
      <View className="px-[21px] pb-8">
        <Text
          style={{ fontSize: 26, fontWeight: "600", color: "#ff6633", textAlign: "center", marginBottom: 12 }}
        >
          Ready to Get Started?
        </Text>
        <Text
          style={{ fontSize: 16, color: "#1a1a1a", textAlign: "center", marginBottom: 32, lineHeight: 22 }}
        >
          Create your profile in minutes and experience a more structured way to connect.
        </Text>

        {/* Login + Sign up — side by side */}
        <View className="flex-row gap-[10px] mb-[12px]">
          <Pressable
            onPress={() => router.push("/(auth)/login")}
            style={{
              flex: 1,
              height: 52,
              backgroundColor: "#99cc33",
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#fff" }}>Login</Text>
          </Pressable>

          <LinearGradient
            colors={["#ff9933", "#ff6633"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={{ flex: 1, borderRadius: 8, overflow: "hidden" }}
          >
            <Pressable
              onPress={() => router.push("/(auth)/signup")}
              style={{ height: 52, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ fontSize: 18, fontWeight: "600", color: "#fff" }}>Sign up</Text>
            </Pressable>
          </LinearGradient>
        </View>

        {/* Guest tour */}
        <Pressable
          onPress={() => router.push("/(app)")}
          style={{
            height: 52,
            backgroundColor: "#1a1a1a",
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#fff" }}>Guest tour</Text>
        </Pressable>

        {/* Terms */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 16, color: "#1a1a1a" }}>Terms of use</Text>
          <View
            style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#1a1a1a", marginHorizontal: 6 }}
          />
          <Text style={{ fontSize: 16, color: "#1a1a1a" }}>Privacy policy</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
