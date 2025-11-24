import { ThemedTextInput } from "@/components/themed-input";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { authClient } from "@/lib/auth-client";
import { useNavigation } from '@react-navigation/native';
import { Image } from "expo-image";
import { Redirect, router } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, TouchableOpacity } from "react-native";

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
    const settings: any =  JSON.parse(await SecureStore.getItemAsync("settings") as unknown as string);
    delete settings.vehicleNumber;
    SecureStore.setItem("settings", JSON.stringify(settings));
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
          secureTextEntry={true}
          textContentType="password"
          onChangeText={(value) => setPassword(value)}
        />
        { loading ? <ThemedText>Загрузка...</ThemedText> : 
          <ThemedView>
            <TouchableOpacity onPress={() => handleLogin()}>
              <ThemedText style={styles.redButton}>Войти</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        }
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
  redButton: {
    backgroundColor: "#DC2626",
    borderRadius: 10,
    padding: 10,
    marginLeft: 20,
    marginRight: 20,
    fontWeight: 300,
    textAlign: "center",
    color: 'white'
  },
});
