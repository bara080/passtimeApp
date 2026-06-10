import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";

export default function Root() {
  useEffect(() => {
    console.log("[Loader] root index mounted — waiting for auth to resolve");
  }, []);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
      <ActivityIndicator color="#ff6633" />
    </View>
  );
}
