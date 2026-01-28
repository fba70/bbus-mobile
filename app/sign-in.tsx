import QrCamera from '@/components/qrCamera';
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

export default function Index() {
  const [session, setSession] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const navigation = useNavigation();
  useEffect(() => {
      navigation.setOptions({
        title: 'Вход',
      });
      const checkSession = async () => {
         if (initialized) return;
        const {data: session} = await authClient.getSession();
        setSession(session as any);
        setInitialized(true);
      }
      checkSession();
  }, [initialized, navigation]);

  const openQrCodeCamera = () => {
    setShowQr(true);
    return;
  }

  const handleQrScanned = async(data: any) => {
    setShowQr(false);
    if (loading === true) return;
    setLoading(true);
    let settings: any =  JSON.parse(await SecureStore.getItemAsync("settings") as unknown as string);
    let credentials = data.split('^');
    setEmail(credentials[0]+"@"+process.env.EXPO_PUBLIC_EMAIL_DOMAIN);
    setPassword(credentials[1]);

    try {
      const result = await authClient.signIn.email({
        email: `${credentials[0]}@${process.env.EXPO_PUBLIC_EMAIL_DOMAIN}`,
        password: credentials[1],
      });

      if (result.error) {
        Alert.alert("Ошибка входа: " + result.error.message);
      } else {
        if (settings != null) {
          settings.vehicleNumber = credentials[0];
        } else {
          settings = {"vehicleNumber": credentials[0]};
        }
        SecureStore.setItem("settings", JSON.stringify(settings));
        router.push("/");
      }
      return;
    } catch(e: any) {
      Alert.alert("Ошибка входа: нет сети");
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  }

  const handleLogin = async () => {
    if (loading === true) return;
    setLoading(true);
    let settings: any =  JSON.parse(await SecureStore.getItemAsync("settings") as unknown as string);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        Alert.alert("Ошибка входа: " + result.error.message);
      } else {
        if (settings != null) {
          settings.vehicleNumber = email.replace("@"+process.env.EXPO_PUBLIC_EMAIL_DOMAIN, "");
        } else {
          settings = {"vehicleNumber": email.replace("@"+process.env.EXPO_PUBLIC_EMAIL_DOMAIN, "")};
        }
        SecureStore.setItem("settings", JSON.stringify(settings));
        router.push("/");
      }
    } catch(e: any) {
      Alert.alert("Ошибка входа: нет сети");
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };
  
  if (!initialized) {
    return <ThemedText></ThemedText>;
  }

  if (session !== null && initialized) {
    return <Redirect href="/" />;
  }
  
  return (
    <ThemedView style={styles.globalContainer}>
      <Image
        source={require("@/assets/images/Logo_BBUS.webp")}
        style={styles.logo}
      />
      <ThemedText style={styles.loginText}>Введите логин и пароль или наведите телефон на QR код</ThemedText>
      <ThemedView style={styles.stepContainer}>
        <ThemedTextInput
          placeholder="Е-майл"
          value={email}
          onChangeText={(value) => setEmail(value)}
        />
{/*
        <TouchableOpacity onPress={() => openQrCodeCamera()}>
          <ThemedText style={styles.greenButton}>Сканировать</ThemedText>
        </TouchableOpacity>
*/}
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

        <ThemedView style={[styles.qrCodeContainer, {display: showQr? undefined: "none"}]}>
          <ThemedView style={{"height": "100%"}}>
            <QrCamera onQrScanned={handleQrScanned} containerStyle={[{"position": "relative", bottom: 0}]} facing={"front"} />
            <TouchableOpacity style={[{"position": "absolute", top: 0, right: 6}]} onPress={() => setShowQr(false)}>
              <ThemedText style={styles.redButton}>Закрыть</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
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
  loginText: {
    textAlign: 'center',
    padding: 5
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
  greenButton: {
    top: -49,
    right: 0,
    position: "absolute",
    backgroundColor: "green",
    borderRadius: 10,
    padding: 10,
    fontWeight: 300,
    textAlign: "center",
    color: 'white'
  },
  qrVehicleNumberContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: "space-between"
  },
  qrVehicleNumberInput: {
    width: "60%",
  },
  qrCodeContainer: {
    zIndex: 10,
    position: "absolute",
    top: 0,
    width: "100%",
    height: "100%",
  },
});
