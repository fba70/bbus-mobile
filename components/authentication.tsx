import QrCamera from '@/components/qrCamera';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { authClient } from "@/lib/auth-client";
import { makeAuthenticatedRequest } from '@/lib/request';
import { getCardById, postponeJourney } from "@/lib/storage";
import { debounce } from '@/lib/utils';
import { useKeyEventListener } from "@/modules/expo-key-event/src/hooks/useKeyEventListener";
import { useAudioPlayer } from 'expo-audio';
import { Image } from "expo-image";
import * as Location from 'expo-location';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet } from 'react-native';
import 'react-native-reanimated';

export default function Authentication(props: any) {
    const { data: session } = authClient.useSession();
    const [passKeyBoxColor, setPassKeyBoxColor] = useState('grey');
    const [initialized, setInitialized] = useState(false);
    const [enabledSound, setEnabledSound] = useState(true);
    const [audioSuccess, setAudioSuccess] = useState(undefined);
    const [audioInvalid, setAudioInvalid] = useState(undefined);
    const [showQr, setShowQr] = useState(false);
    const [handlingCard, setHandlingCard] = useState(false);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [lastConnectedTime, setLastConnectedTime] = useState("");
    const [passKeyTitle, setPassKeyTitle] = useState("Приложите пропуск");
    let audioSuccessPlayer = useAudioPlayer(audioSuccess);
    let audioInvalidPlayer = useAudioPlayer(audioInvalid);
  
    useEffect(() => {
      const loadSettings = async () => {
        if (initialized) return;
        setInitialized(true);
        try {
            const settings = JSON.parse(await SecureStore.getItemAsync("settings") as unknown as string);
            if (settings != null) {
              setEnabledSound(settings.enabledSound);
              setAudioSuccess(settings.audioSuccess);
              setAudioInvalid(settings.audioInvalid);
            }
        } catch(e: any) {
          console.log(e);
        }
      }
      loadSettings();

      async function getCurrentLocation() {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert('Необходимо разрешить геолокации на устройстве');
          router.push("/");
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
      }
      getCurrentLocation();

      async function getLastConnectedTime() {
        const _time = new Date();
        _time.setTime(parseInt(await SecureStore.getItemAsync("lastConnectedTime") ?? "0"));
        setLastConnectedTime(_time.toLocaleString());
      }

      getLastConnectedTime();
    }, [audioInvalid, audioSuccess, initialized, lastConnectedTime]);

    let currentCardFromKeybroad = "";
    useKeyEventListener(async (event) => {
      if (event) {
        currentCardFromKeybroad += event.key;
      }
      Alert.alert("event: " + JSON.stringify(event));
      debounce(() => {
        Alert.alert("currentCardFromKeybroad: " + currentCardFromKeybroad);
        handleCard(currentCardFromKeybroad);
        currentCardFromKeybroad = "";
      }, 2000);
    });
      
    const handleQrScanned = async (data: any) => {
      handleCard(data);
    };

    const handleCard = async (cardId: string) => {
      if (handlingCard) return;
      setHandlingCard(true);
      const сard: any = await getCardById(props.db, cardId);
      if (сard == null) {
        setPassKeyBoxColor('red');
        setTimeout(() => {
          setPassKeyBoxColor('grey');
          setPassKeyTitle("Приложите пропуск");
          setHandlingCard(false);
        }, 1000);
        if (enabledSound) {
          audioInvalidPlayer.play();
          setTimeout(() => {
            audioInvalidPlayer.pause();
            audioInvalidPlayer.seekTo(0);
          }, 1000);
        }
        return;
      }

      const settings: any = await SecureStore.getItemAsync("settings");
      if (settings == null || !(JSON.parse(settings).applicationId)) {
        Alert.alert("Настройки не найдены. Перейдите в настройки и заполните их.");
        router.push("/");
        return;
      }

      if (location == null) {
        router.push("/");
        return;
      }

      const journey = {   sessionUserId: session?.user.id,
                          routeId: props.route.id,
                          journeyTimeStamp: new Date().toISOString(),
                          coordinatesLattitude: location?.coords.latitude,
                          coordinatesLongitude: location?.coords.longitude,
                          journeyStatus: "AUTHORIZATION_OK", // "AUTHORIZATION_FAILED"
                          accessCardId: сard.id,
                          busId: props.bus.id,
                          applicationId: (JSON.parse(settings).applicationId)
                        };

      try {
        const result = await makeAuthenticatedRequest('journeys', JSON.stringify(journey), "POST");
        if (result?.error) {
          postponeJourney(props.db, journey);
        }
      } catch(e: any) {
        postponeJourney(props.db, journey);
      }

      setPassKeyBoxColor('green');
      setPassKeyTitle(JSON.parse(сard.data).nameOnCard);
      setTimeout(() => {
        setPassKeyBoxColor('grey');
        setPassKeyTitle("Приложите пропуск");
        setHandlingCard(false);
      }, 1000);
      if (enabledSound) {
        audioSuccessPlayer.play();
        setTimeout(() => {
          audioSuccessPlayer.pause();
          audioSuccessPlayer.seekTo(0);
        }, 1000);
      }
    }

    const logo = props.route.organization?.metadata ? JSON.parse(props.route.organization?.metadata).logo: "";

    const signatures = {
      "R0lGODdh": "image/gif",
      "R0lGODlh": "image/gif",
      "iVBORw0KGgo": "image/png",
      "/9j/": "image/jpg"
    } as any;

    let signature = "image/png";
    for (let s in signatures) {
      if (logo.indexOf(s) === 0) {
        signature = signatures[s];
      }
    }

    return <ThemedView style={styles.globalContainer}>
              <ThemedView style={styles.clientHeader}>
                <ThemedText style={styles.textContainer}>{props.route.organization?.name}</ThemedText>
                <ThemedText style={styles.textContainer}>{props.route.routeName}</ThemedText>
              </ThemedView>
              {showQr === false ? 
                <ThemedView style={[{backgroundColor: passKeyBoxColor}, styles.passKeyBox]}>
                  <ThemedText style={styles.attachPasskey}>{passKeyTitle}</ThemedText>
                  {logo !== "" 
                  ?
                      <Image source={`data:${signature};base64,${logo}`} style={styles.logo}/>
                  :
                      <Image source={require("@/assets/images/Logo_BBUS.webp")} style={styles.logo}/>
                  }
                </ThemedView>
              : 
                null
              }
              <QrCamera onQrScanned={handleQrScanned} containerStyle={[styles.container, {display: showQr? "block": "none"}]} facing={"back"} />
              {<Button title={`${!showQr ? "Показать" : "Скрыть"} видео с камеры для Qr кода`} onPress={() => setShowQr(!showQr)} ></Button>}

              <ThemedText style={styles.textContainer}>Режим работы: Авторизация.</ThemedText>
              <ThemedText style={styles.textContainer}>Обмен с сервером: {lastConnectedTime}</ThemedText>
            </ThemedView>
}

const styles = StyleSheet.create({
  textContainer: {
    textAlign: 'center',
  },
  globalContainer: {
    height: '100%',
    width: '100%',
  },
  clientHeader: {
    padding: 20,
    borderColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 10,
    borderWidth: 1,
    margin: 10
  },
  attachPasskey: {
    marginTop: 20,
    fontSize: 20,
    textAlign: 'center'
  },
  passKeyBox: {
    borderRadius: 20,
    marginLeft: 'auto',
    marginRight: 'auto',
    width: 300,
    height: 400,
    margin: 20,
  },
  container: {
    top: 0,
    position: 'relative',
    height: 400,
    marginTop: 30,
    width: '100%',
  },
  logo: {
    marginTop: 30,
    marginLeft: 'auto',
    marginRight: 'auto',
    width: 200,
    height: 200,
  }
});
