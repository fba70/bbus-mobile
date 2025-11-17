import Authentication from '@/components/authentication';
import Registration from '@/components/registration';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { authClient } from "@/lib/auth-client";
import { makeAuthenticatedRequest } from '@/lib/request';
import { Link, router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Image, StyleSheet } from "react-native";
import 'react-native-reanimated';

export default function MainLayout() {
  const { data: session } = authClient.useSession();
  const [route, setRoute] = useState({} as any);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (initialized) return;
      setInitialized(true);
      try {
          const settings = JSON.parse(await SecureStore.getItemAsync("settings") as unknown as string);

          let vehicleNumber = "";
          if (settings != null) {
            const {vehicleNumber: currentVehicleNumber} = settings;
            if (currentVehicleNumber) {
              vehicleNumber = currentVehicleNumber;
            } else {
              vehicleNumber = "";  
            }
          } else {
            vehicleNumber = "";
          }

          if (vehicleNumber == null || typeof(vehicleNumber) == "undefined" || vehicleNumber === "") {  
            Alert.alert("Введите номер автобуса");
            router.push("/settings");
            return;
          }

          let buses = [];
          try {
            buses = await makeAuthenticatedRequest('buses?userId='+session?.user.id);
            SecureStore.setItemAsync("buses", JSON.stringify(buses));
            setConnected(true);
          } catch(e: any) {
            if (buses?.error) {
              console.log(buses.error);
              setConnected(false);
              return;
            }
            console.log("нет сети", e);
            setConnected(false);
            const storedBuses = await SecureStore.getItemAsync("buses") as unknown as string;
            if (storedBuses != null) {
              buses = JSON.parse(await SecureStore.getItemAsync("buses") as unknown as string);
            }
          }

          const currentBus = buses.filter((bus: any) => {
            return bus.busPlateNumber === vehicleNumber;
          });

          if (currentBus.length === 0) {
            Alert.alert("Автобус с номером " + vehicleNumber + " не найден в вашей учетной записи. Пожалуйста, выберите корректный номер автобуса в настройках.");
            router.push("/settings");
            return;
          }
          
          let routes = [];
          try {
            routes = await makeAuthenticatedRequest('routes?userId='+session?.user.id);
            SecureStore.setItemAsync("routes", JSON.stringify(routes));
          } catch(e: any) {
            if (routes?.error) {
              console.log(routes.error);
              setConnected(false);
              return;
            }
            console.log("нет сети", e);
            setConnected(false);
            const storedRoutes = await SecureStore.getItemAsync("routes") as unknown as string;
            if (storedRoutes != null) {
              routes = JSON.parse(await SecureStore.getItemAsync("routes") as unknown as string);
            }
          }
        
          const currentRoute = routes.filter((route: any) => route.id === currentBus[0].routeId);
          console.log(currentRoute[0]);
          setRoute(currentRoute[0]);
      } catch (error: any) {
          console.log("Error fetching data:", error);
          Alert.alert("Нет сети, перезагрузите страницу позднее.");
          setConnected(false);
      } finally {
          setLoading(false);
      }
    };

    loadData();
  }, [initialized, session?.user.id]); // Empty dependency array to run once on mount

  const handleReload = () => {
    router.push("/main");
  }

  if (loading) {
    return <ThemedView style={styles.globalContainer}>
            <ThemedText style={styles.textContainer}>Загрузка...</ThemedText>
          </ThemedView>;
  }

  if (connected === false) {
    return  <ThemedView style={styles.globalContainer}>
              <ThemedView style={styles.textContainer}>
                <Button title="Перезагрузить" onPress={() => {handleReload()}}/>
              </ThemedView>
            </ThemedView>;
  }

  return (
    <ThemedView>
      <ThemedView style={styles.header}>
        <Image source={require("@/assets/images/Logo_BBUS.webp")}/>
        <Link href="/settings" style={styles.menu}>
          <IconSymbol color="white" name='ellipsis'/>
        </Link>
      </ThemedView>
      {route != null && route.routeMode === "REGISTRATION" ?
        <Registration route={route} />
        :
        <Authentication route={route}/>
      }
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  globalContainer: {
    height: '100%',
    width: '100%',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
  },
  menu: {
    marginTop: 75,
  },
  textContainer: {
    top: '50%',
    marginLeft: 10,
    marginRight: 10,
    width: '100%',
    position: 'absolute',
  },
});