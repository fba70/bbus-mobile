
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authClient } from "@/lib/auth-client";
import { registerBackgroundTaskAsync } from "@/lib/cron";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity } from "react-native";
import 'react-native-reanimated';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [connected, setConnected] = useState(true);
  const [initialized, setInitialized] = useState(false);
  registerBackgroundTaskAsync();
  useEffect(() => {
    const loadSession = async () => {
      if (initialized) return;
      setInitialized(true);
      try {
        await authClient.getSession();
      } catch(e: any) {
        console.log('Error loading session:', e.message);
        setConnected(false);
      }
    }
    loadSession();
  }, [initialized]);
  
  const handleReload = () => {
    router.replace("/");
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {connected === false ?
        <ThemedView style={styles.globalContainer}>
          <ThemedView style={styles.textContainer}>
            <TouchableOpacity onPress={() => handleReload()}>
              <ThemedText style={styles.redButton}>Нет сети. Перезагрузить</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      : 
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
      }
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  globalContainer: {
    height: '100%',
    width: '100%',
  },
  textContainer: {
    top: '50%',
    width: '100%',
    position: 'absolute',
  },
  redButton: {
    backgroundColor: "#DC2626",
    borderRadius: 10,
    padding: 10,
    fontWeight: 300,
    textAlign: "center",
    color: 'white',
    marginLeft: "auto",
    marginRight: "auto",
    width: "80%"
  },
});