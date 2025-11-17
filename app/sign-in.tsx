import { ThemedTextInput } from "@/components/themed-input";
import { ThemedView } from "@/components/themed-view";
import { authClient } from "@/lib/auth-client";
import { Image } from "expo-image";
import React, { useState } from "react";
import { Button, StyleSheet } from "react-native";

export default function SignIn() {
  const { data: session } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const handleLogin = async () => {
    await authClient.signIn.email({
      email,
      password,
    });
  };
  console.log("sedd", session);
  /*
  if (session !== null) {
    return <Redirect href="/main" />;
  }*/
  return (
    <ThemedView style={styles.globalContainer}>
      <Image
        source={require("@/assets/images/Logo_BBUS.webp")}
        style={styles.logo}
      />
      <ThemedView style={styles.stepContainer}>
        <ThemedTextInput
          placeholder="Email"
          value={email}
          onChangeText={(value) => setEmail(value)}
        />
        <ThemedTextInput
          placeholder="Password"
          value={password}
          onChangeText={(value) => setPassword(value)}
        />
        <Button title="Login" onPress={() => handleLogin()} />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  globalContainer: {
    height: '100%',
    width: '100%',
    padding: 20,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  logo: {
    marginTop: 50,
    marginLeft: 'auto',
    marginRight: 'auto',
    height: 140,
    width: 346,
  },
});
