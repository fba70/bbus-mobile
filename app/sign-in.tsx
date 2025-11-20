import { ThemedTextInput } from "@/components/themed-input";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { authClient } from "@/lib/auth-client";
import { useNavigation } from '@react-navigation/native';
import { Image } from "expo-image";
import { Redirect, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Button, StyleSheet } from "react-native";

export default function SignIn() {
  const { data: session } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  useEffect(() => {
      navigation.setOptions({
        title: 'Вход',
      });
  });

  const handleLogin = async () => {
    setLoading(true);
    const result = await authClient.signIn.email({
      email,
      password,
    });

    setLoading(false);
    if (result.error) {
      Alert.alert("Ошибка входа: " + result.error.message);
    } else {
      router.push("/");
    }
  };

  if (session !== null) {
    return <Redirect href="/" />;
  }
  
  return (
    <ThemedView style={styles.globalContainer}>
      <Image
        source={require("@/assets/images/Logo_BBUS.webp")}
        style={styles.logo}
      />
      <ThemedView style={styles.stepContainer}>
        <ThemedTextInput
          placeholder="Е-майл"
          value={email}
          onChangeText={(value) => setEmail(value)}
        />
        <ThemedTextInput
          placeholder="Пароль"
          value={password}
          onChangeText={(value) => setPassword(value)}
        />
        { loading ? <ThemedText>Загрузка...</ThemedText> : <Button title="Войти" onPress={() => handleLogin()} /> }
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
