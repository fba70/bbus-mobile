import QrCamera from '@/components/qrCamera';
import { ThemedTextInput } from '@/components/themed-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { authClient } from "@/lib/auth-client";
import { makeAuthenticatedRequest } from '@/lib/request';
import { addLog, getCardById, postponeJourney } from "@/lib/storage";
import { debounce } from "@/lib/utils";
import { useAudioPlayer } from 'expo-audio';
import { Image } from "expo-image";
import * as Location from 'expo-location';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, StyleSheet, TouchableOpacity } from 'react-native';
import 'react-native-reanimated';

export default function Registration(props: any) {
    const { data: session } = authClient.useSession();
    const [passKeyBoxColor, setPassKeyBoxColor] = useState('#F3F4F6');
    const [initialized, setInitialized] = useState(false);
    const [enabledSoundSuccess, setEnabledSoundSuccess] = useState(true);
    const [enabledFrontCamera, setEnabledFrontCamera] = useState(true);
    const [audioSuccess, setAudioSuccess] = useState(undefined);
    const [passengerName, setPassengerName] = useState("");
    const [showQr, setShowQr] = useState(false);
    const [handlingCard, setHandlingCard] = useState(false);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [lastConnectedTime, setLastConnectedTime] = useState("");
    let audioSuccessPlayer = useAudioPlayer(audioSuccess === undefined ? require("@/assets/audios/crystalring.mp3") : audioSuccess);
    const inputRef = useRef(ThemedTextInput);

    useEffect(() => {
      const loadSettings = async () => {
        if (initialized) return;
        setInitialized(true);
        try {
            const settings = JSON.parse(await SecureStore.getItemAsync("settings") as unknown as string);
            if (settings != null) {
              setEnabledSoundSuccess(settings.enabledSoundSuccess !== undefined ? settings.enabledSoundSuccess : true);
              setAudioSuccess(settings.audioSuccess);
              setEnabledFrontCamera(settings.enabledFrontCamera);
            }
        } catch(e: any) {
          console.log(e);
        }
      }
      loadSettings();

      async function getCurrentLocation() {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Необходимо разрешить геолокации на устройстве');
          router.push("/");
          return;
        }

        setLocation(await Location.getCurrentPositionAsync({}));
      }
      getCurrentLocation();

      async function getLastConnectedTime() {
        const _time = new Date();
        _time.setTime(parseInt(await SecureStore.getItemAsync("lastConnectedTime") ?? "0"));
        setLastConnectedTime(_time.toLocaleString());
      }

      getLastConnectedTime();

    }, [audioSuccess, enabledFrontCamera, initialized, lastConnectedTime]);

    const handleQrScanned = async (data: any) => {
      if (handlingCard) return;
      setHandlingCard(true);
      setPassengerName(data);
      setTimeout(() => {
        setPassengerName("");
      }, 500);
      handleCard(data, "QR_CODE");
    };

    const handleCardFromKeyboard = async (data: any) => {
      setTimeout(() => {
        setPassengerName("");
        inputRef.current.clear();
      }, 500);
      if (handlingCard) return;
      setHandlingCard(true);
      setPassengerName(data);
      handleCard(data, "RFID");
    }

    const handleCard = async (cardId: string, cardType: string) => {
      const settings: any = await SecureStore.getItemAsync("settings");

      addLog(props.db, "handle card by registration mode", JSON.stringify({cardId, cardType}));

      if (settings == null || !(JSON.parse(settings).applicationId)) {
        Alert.alert("Настройки не найдены. Обновление данных.");
        router.push("/");
        return;
      }

      const journey = {   sessionUserId: session?.user.id,
                          routeId: props.route.id,
                          journeyTimeStamp: new Date().toISOString(),
                          coordinatesLattitude: location?.coords.latitude,
                          coordinatesLongitude: location?.coords.longitude,
                          journeyStatus: "REGISTRATION_OK", //| "REGISTRATION_ERROR" | "AUTHORIZATION_OK" | "AUTHORIZATION_FAILED" | "AUTHORIZATION_ERROR" | null
                          busId: props.bus.id,
                          applicationId: (JSON.parse(settings).applicationId)
                        } as any;

      const сard: any = await getCardById(props.db, cardId, props.route.organization.id);
      if (сard == null) {
        journey.accessCardId = "acebbd7a-e282-4aeb-8631-c49e93d230a1";
        journey.newCardId = cardId;
        journey.newCardType = cardType; //"NFC", "RFID", "QR_CODE")
      } else {
        journey.accessCardId = сard.id;
      }

      try {
        const result = await makeAuthenticatedRequest('journeys', JSON.stringify(journey), "POST");
        if (result?.error) {
          postponeJourney(props.db, journey);
        } else {
          addLog(props.db, "sent journey registration", JSON.stringify(journey));
        }
      } catch(e: any) {
        postponeJourney(props.db, journey);
      }

      setPassKeyBoxColor('green');
      setTimeout(() => {
        setPassKeyBoxColor('#F3F4F6');
        setHandlingCard(false);
      }, 1000);
      if (enabledSoundSuccess) {
        audioSuccessPlayer.play();
        setTimeout(() => {
          audioSuccessPlayer.pause();
          audioSuccessPlayer.seekTo(0);
        }, 3000);
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

    return <ThemedView style={styles.globalContainer} tabIndex={-1}>
              <ThemedTextInput ref={inputRef} tabIndex={0} autoFocus={true} showSoftInputOnFocus={false} accessible={false}
                onChangeText={debounce((value: string) => {handleCardFromKeyboard(value)}, 100)}
                style={styles.cardFromKeyboard} onBlur={() => { Keyboard.dismiss(); inputRef.current.focus(); }} />
              <ThemedView style={styles.clientHeader} tabIndex={-1}>
                <ThemedText style={styles.textContainerBold}>{props.route.organization.name}</ThemedText>
                <ThemedText style={[styles.textContainerBold, {color: '#6A7282'}]}>{props.route.routeName}</ThemedText>
              </ThemedView>
              <ThemedView style={[styles.passKeyBox, {backgroundColor: passKeyBoxColor}]} tabIndex={-1}>
                {showQr === false ? 
                  <ThemedView style={{backgroundColor: "transparent"}}>
                    <Image source={require("@/assets/images/hotpot.png")} style={styles.hotpot}/>
                    <ThemedText style={styles.attachPasskey}>Приложите карту к считывателю или покажите QR код</ThemedText>
                    {logo !== "" 
                    ?
                        <Image source={`data:${signature};base64,${logo}`} contentFit='contain' style={styles.logo}/>
                    :
                        <Image source={require("@/assets/images/Logo_BBUS.webp")} style={styles.logo}/>
                    }
                  </ThemedView>
                : 
                  null
                }
                <QrCamera onQrScanned={handleQrScanned} containerStyle={[styles.container, {display: showQr? "block": "none"}]} facing={enabledFrontCamera ? "front": "back"} />
                <ThemedText style={styles.textPassengerName}>{passengerName ? passengerName: "ФИО сотрудника"}</ThemedText>
              </ThemedView>
              {
                <ThemedView tabIndex={-1}>
                  <TouchableOpacity onPress={() => setShowQr(!showQr)}>
                    <ThemedText style={styles.redButton}>{`${!showQr ? "Показать" : "Скрыть"} видео с камеры для Qr кода`}</ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              }
            </ThemedView>
}

//<ThemedText style={styles.textContainer}>Режим работы: Регистрация.</ThemedText>
//<ThemedText style={styles.textContainer}>Обмен с сервером: {lastConnectedTime}</ThemedText>

const styles = StyleSheet.create({
  textContainer: {
    textAlign: 'center',
    fontSize: 20,
    marginBottom: 8,
  },
  textContainerBold: {
    textAlign: 'center',
    fontSize: 24,
    marginBottom: 8,
    textTransform: "uppercase"
  },
  hotpot: {
    marginLeft: 'auto',
    marginRight: 'auto',
    width: 100,
    height: 100,
  },
  globalContainer: {
    height: '100%',
    width: '100%',
  },
  clientHeader: {
    padding: 20,
    margin: 10
  },
  attachPasskey: {
    marginTop: 10,
    fontSize: 20,
    textAlign: 'center',
    color: '#4A5565'
  },
  passKeyBox: {
    borderRadius: 20,
    marginLeft: 'auto',
    marginRight: 'auto',
    width: 300,
    height: 400,
    margin: 20,
    marginTop: 0,
    borderWidth: 3,
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6'
  },
  container: {
    top: 0,
    position: 'relative',
    height: 270,
    marginTop: 30,
    width: '100%',
  },
  logo: {
    marginTop: 30,
    marginLeft: 'auto',
    marginRight: 'auto',
    width: 100,
    height: 100,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#D1D5DC',
    objectFit: "contain"
  },
  textPassengerName: {
    borderTopWidth: 1,
    borderColor: "#D1D5DC",
    color: "#99A1AF",
    textAlign: "center",
    marginTop: 30,
    paddingTop: 20,
    textTransform: "uppercase",
    fontSize: 24,
    
  },
  cardFromKeyboard: {
    position: 'absolute',
    left: -1000
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
  }
});
