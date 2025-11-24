import Authentication from '@/components/authentication';
import Registration from '@/components/registration';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { authClient } from "@/lib/auth-client";
import { makeAuthenticatedRequest } from '@/lib/request';
import { getBusByNumber, getBusesCount, getNewAccessCards, getNewBuses, getNewRoutes, getRoutes, initDb } from '@/lib/storage';
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

          try {
            if (await getBusesCount(_db) === 0) {
              await getNewBuses(_db, session?.user.id);
            } else {
              getNewBuses(_db, session?.user.id);
            }
          } catch(e: any) {
            console.log("нет buses сети", e);
            //setConnected(false);
          }

          const _currentBus: any = await getBusByNumber(_db, vehicleNumber);

          if (_currentBus === null) {
            Alert.alert("Автобус с номером " + vehicleNumber + " не найден в вашей учетной записи. Пожалуйста, выберите корректный номер автобуса в настройках.");
            router.push("/settings");
            return;
          }

          setCurrentBus(_currentBus);

          let routes: any = (await getRoutes(_db)).map((item: any) => JSON.parse(item.data));
          try {
            if (routes.length === 0 ) {
              routes = await getNewRoutes(_db, session?.user.id);
            } else {
              routes = getNewRoutes(_db, session?.user.id);
            }
          } catch(e: any) {
            console.log("нет routes сети", e);
            //setConnected(false);
          }

          getNewAccessCards(_db, session?.user.id);

          let timeSlots = JSON.parse(_currentBus.data).timeSlots;
          if (timeSlots?.length > 0) {
            timeSlots.map((slot: any) => {
              if (new Date(slot.startTimestamp).getTime() < new Date().getTime() && new Date().getTime() < new Date(slot.endTimestamp).getTime()) {
                _currentBus.routeId = slot.routeId;
                return;
              }
            });
          }

          const currentRoute = routes.filter((route: any) => route.id === _currentBus.routeId);
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
    <ThemedView tabIndex={-1}>
      <ThemedView style={styles.header} tabIndex={-1}>
        <Image style={styles.headerImage} source={require("@/assets/images/Logo_BBUS.webp")} />
        <Link href="/settings" style={styles.headerIcon} tabIndex={-1}>
          <IconSymbol size={35}  color="black" name='ellipsis'/>
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
    borderBottomColor: "rgb(0,0,0,0.1)",
    borderBottomWidth: 2,
    height: "8%",
    marginBottom: 0,
    marginTop: 20,
    paddingLeft: 10,
  },
  headerImage: {
    height: "auto",
    width: "60%",
  },
  headerIcon: {
    display: "flex",
    verticalAlign: "middle",
    width: "40%",
    textAlign: "right",
    alignItems: 'baseline',
    paddingRight: 10,
    marginTop: 10,
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