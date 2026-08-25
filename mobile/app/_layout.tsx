import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/auth/AuthContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerStyle: { backgroundColor: "#3d2b1f" }, headerTintColor: "#fff" }}>
          <Stack.Screen name="login" options={{ title: "Sign in", headerShown: false }} />
          <Stack.Screen name="index" options={{ title: "My Runs" }} />
          <Stack.Screen name="route/[runId]/index" options={{ title: "Route" }} />
          <Stack.Screen name="route/[runId]/stop/[stopId]" options={{ title: "Stop" }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
