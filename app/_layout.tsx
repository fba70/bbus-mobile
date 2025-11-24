
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authClient } from "@/lib/auth-client";
import "@/lib/cron";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet } from "react-native";
import 'react-native-reanimated';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [connected, setConnected] = useState(true);
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    const loadSession = async () => {
      if (initialized) return;
      setInitialized(true);
      try {
        const { data: session } = await authClient.getSession();
        if (session == null) {
          router.push('/sign-in');
        }
      } catch(e: any) {
        console.log('Error loading session:', e.message);
        setConnected(false);
      }
    }
    loadSession();
  }, [initialized]);
  
  const handleReload = () => {
    router.push("/");
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {connected === false ?
        <ThemedView style={styles.globalContainer}>
          <ThemedView style={styles.textContainer}>
            <Button title="Перезагрузить" onPress={() => {handleReload()}}/>
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
    marginLeft: 10,
    marginRight: 10,
    width: '100%',
    position: 'absolute',
  },
});