import Authentication from '@/components/authentication';
import Registration from '@/components/registration';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { authClient } from "@/lib/auth-client";
import { makeAuthenticatedRequest } from '@/lib/request';
import { addLog, deleteJourney, getBusByNumber, getBusesCount, getJourneys, getNewAccessCards, getNewBuses, getNewRoutes, getRoutes, initDb } from '@/lib/storage';
import { Link, router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, TouchableOpacity } from "react-native";
import 'react-native-reanimated';

export default function Main() {
  const [session, setSession] = useState(null);
  const [route, setRoute] = useState(null as any);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [db, setDb] = useState(null as any);
  const [currentBus, setCurrentBus] = useState(null as any);

  useEffect(() => {
    const loadData = async () => {
      if (initialized) return;
      setInitialized(true);
      const {data: session} = await authClient.getSession();
      setSession(session as any);
      if (session == null) {
        router.replace("/sign-in");
        return;
      }
      const _db = await initDb();
      setDb(_db);
      try {
          const settings = JSON.parse(await SecureStore.getItemAsync("settings") as unknown as string);

          try {
            const apps = await makeAuthenticatedRequest('applications?userId='+session?.user.id);
            settings.applicationId = apps.length > 0 ? apps[0].id : null;
            SecureStore.setItemAsync("settings", JSON.stringify(settings));
            setConnected(true);
          } catch(e: any) {
            console.log("нет сети apps", e);
            addLog(db, "нет сети apps:", JSON.stringify(e));
            setConnected(false);
          }

          try {
            if (await getBusesCount(_db) === 0) {
              await getNewBuses(_db, session?.user.id);
            } else {
              getNewBuses(_db, session?.user.id);
            }
          } catch(e: any) {
            console.log("нет сети buses", e);
            addLog(db, "нет сети buses:", JSON.stringify(e));
            //setConnected(false);
          }

          const _currentBus: any = await getBusByNumber(_db, settings.vehicleNumber);

          if (_currentBus === null) {
            Alert.alert("Автобус с номером " + settings.vehicleNumber + " не найден в вашей учетной записи. Зайдите другим пользователем.");
            router.push("/settings");
            return;
          }

          setCurrentBus(_currentBus);

          let routes: any = [];
          try {
            routes = await getNewRoutes(_db, session?.user.id);
          } catch(e: any) {
            routes = (await getRoutes(_db)).map((item: any) => JSON.parse(item.data));
            console.log("нет сети routes", e);
            addLog(db, "нет сети routes:", JSON.stringify(e));
            //setConnected(false);
          }

          const sendPostponedJourneys = async () => {
            const journeys = await getJourneys(_db);
            journeys.map(async (journey: any) => {
              let shouldDelete: boolean = false;
              try {
                const result = await makeAuthenticatedRequest('journeys', journey.data, "POST");
                if (result?.error) {
                  shouldDelete = false;
                } else {
                  shouldDelete = true;
                  addLog(_db, "sent journey", journey.data);
                }
              } catch(e: any) {
                shouldDelete = false;
              }
              if (shouldDelete) {
                await deleteJourney(_db, journey.id);
              }
            });
          }

          sendPostponedJourneys();

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
          if (currentRoute.length === 0) {
            Alert.alert("Для вашего ТС нет маршрута. Войдите другим пользователем.");
            router.push("/settings");
            return;
          } else {
            setRoute(currentRoute[0]);
            getNewAccessCards(_db, session?.user.id, currentRoute[0].organization.id);
          }
      } catch (error: any) {
          console.log("Error fetching data:", error);
          addLog(db, "Error fetching data:", JSON.stringify(error));
          Alert.alert("Нет сети, перезагрузите страницу позднее.");
          setConnected(false);
      } finally {
          setLoading(false);
      }
    };

    loadData();
  }, [db, initialized, session]); // Empty dependency array to run once on mount

  const handleReload = () => {
    router.push("/");
  }

  if (loading) {
    return <ThemedView style={styles.globalContainer}>
            <ThemedText style={styles.textLoading}>Загрузка...</ThemedText>
          </ThemedView>;
  }

  if (connected === false) {
    return  <ThemedView style={styles.globalContainer}>
              <ThemedView style={styles.textContainer}>
                <TouchableOpacity onPress={() => handleReload()}>
                  <ThemedText style={styles.redButton}>Перезагрузить</ThemedText>
                </TouchableOpacity>
                <ThemedView style={styles.gap}></ThemedView>
                <TouchableOpacity onPress={() => authClient.signOut()}>
                  <ThemedText style={styles.redButton}>Выйти</ThemedText>
                </TouchableOpacity>
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
      {route != null ? 
        ( route.routeMode === "REGISTRATION" ?
          <Registration route={route} bus={currentBus} db={db} />
          :
          <Authentication route={route} bus={currentBus} db={db}/>
        ) : ""
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
  gap: {
    height: 10,
    width: "100%",
    marginTop: 10,
    marginBottom: 10,
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
    width: '100%',
    position: 'absolute',
  },
  textLoading: {
    marginTop: '50%',
    width: '100%',
    textAlign: 'center'
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