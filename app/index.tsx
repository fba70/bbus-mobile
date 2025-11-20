import Authentication from '@/components/authentication';
import Registration from '@/components/registration';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { authClient } from "@/lib/auth-client";
import { makeAuthenticatedRequest } from '@/lib/request';
import { getBusByNumber, getRoutes, initDb, updateAccessCards, updateBuses, updateRoutes } from '@/lib/storage';
import { Link, Redirect, router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Image, StyleSheet } from "react-native";
import 'react-native-reanimated';

export default function Main() {
  const { data: session } = authClient.useSession();
  const [route, setRoute] = useState({} as any);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [db, setDb] = useState(null as any);
  const [currentBus, setCurrentBus] = useState(null as any);

  useEffect(() => {
    if (session == null) return;
    
    const loadData = async () => {
      if (initialized) return;
      setInitialized(true);
      const _db = await initDb();
      setDb(_db);
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

          try {
            const apps = await makeAuthenticatedRequest('applications?userId='+session?.user.id);
            settings.applicationId = apps.length > 0 ? apps[0].id : null;
            SecureStore.setItemAsync("settings", JSON.stringify(settings));
            setConnected(true);
          } catch(e: any) {
            console.log("нет apps сети", e);
            setConnected(false);
          }

          let buses = [];
          try {
            buses = await makeAuthenticatedRequest('buses?userId='+session?.user.id);
            if (buses?.error) {
              console.log(buses.error);
              setConnected(false);
              return;
            }
            updateBuses(_db, buses);
            setConnected(true);
          } catch(e: any) {
            console.log("нет сети", e);
            setConnected(false);
          }

          const _currentBus: any = await getBusByNumber(_db, vehicleNumber);

          if (_currentBus === null) {
            Alert.alert("Автобус с номером " + vehicleNumber + " не найден в вашей учетной записи. Пожалуйста, выберите корректный номер автобуса в настройках.");
            router.push("/settings");
            return;
          }
          setCurrentBus(_currentBus);
          let routes = [];
          try {
            routes = await makeAuthenticatedRequest('routes?userId='+session?.user.id);
            if (routes?.error) {
              console.log(routes.error);
              setConnected(false);
              return;
            }
            updateRoutes(_db, routes);
          } catch(e: any) {
            console.log("нет routes сети", e);
            setConnected(false);
            routes = await getRoutes(_db);
          }
        
          const currentRoute = routes.filter((route: any) => route.id === _currentBus.routeId);
          setRoute(currentRoute[0]);

          try {
            const cards = await makeAuthenticatedRequest('access-cards?userId='+session?.user.id);
            if (cards?.error) {
              console.log(cards.error);
              setConnected(false);
              return;
            }
            updateAccessCards(_db, cards);
          } catch(e: any) {
            console.log("нет cards сети", e);
            setConnected(false);
          }

      } catch (error: any) {
          console.log("Error fetching data:", error);
          Alert.alert("Нет сети, перезагрузите страницу позднее.");
          setConnected(false);
      } finally {
          setLoading(false);
      }
    };

    loadData();
  }, [initialized, session, session?.user.id]); // Empty dependency array to run once on mount

  const handleReload = () => {
    router.push("/");
  }

  if (session == null) {
    return <Redirect href="/sign-in" />;
  }

  if (loading) {
    return <ThemedView style={styles.globalContainer}>
            <ThemedText style={styles.textLoading}>Загрузка...</ThemedText>
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
          <IconSymbol color="black" name='ellipsis'/>
        </Link>
      </ThemedView>
      {route != null && route.routeMode === "REGISTRATION" ?
        <Registration route={route} bus={currentBus} db={db} />
        :
        <Authentication route={route} bus={currentBus} db={db}/>
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
    backgroundColor: 'red',
    borderBottomLeftRadius: 50,
    padding: 10,
  },
  menu: {
    marginTop: 65,
  },
  textContainer: {
    top: '50%',
    marginLeft: 10,
    marginRight: 10,
    width: '100%',
    position: 'absolute',
  },
  textLoading: {
    marginTop: '50%',
    width: '100%',
    textAlign: 'center'
  }
});