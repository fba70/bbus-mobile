import { ThemedTextInput } from "@/components/themed-input";
import { ThemedSwitch } from "@/components/themed-switch";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { authClient } from "@/lib/auth-client";
import { makeAuthenticatedRequest } from '@/lib/request';
import { initDb, updateAccessCards, updateBuses, updateRoutes } from '@/lib/storage';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { Redirect, router } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from "react";
import { Alert, Button, StyleSheet } from "react-native";

export default function Settings() {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [enabledSound, setEnabledSound] = useState(false);
  const [durationNameDisplaying, setDurationNameDisplaying] = useState(5);
  const [audioSuccess, setAudioSuccess] = useState<DocumentPicker.DocumentPickerAsset>();
  const [audioInvalid, setAudioInvalid] = useState<DocumentPicker.DocumentPickerAsset>();
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [db, setDb] = useState(null as any);
  const navigation = useNavigation();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    navigation.setOptions({
      title: 'Настройки',
    });

    if (session == null) return;
    const loadSettings = async () => {
      if (initialized) return;
      const _db = await initDb();
      setDb(_db);
      const settings =  JSON.parse(await SecureStore.getItemAsync("settings") as unknown as string);
      if (settings != null) {
        setVehicleNumber(settings.vehicleNumber || vehicleNumber);
        setEnabledSound(settings.enabledSound || enabledSound);
        setDurationNameDisplaying(settings.durationNameDisplaying || durationNameDisplaying);
        setAudioSuccess(settings.audioSuccess || audioSuccess);
        setAudioInvalid(settings.audioInvalid || audioInvalid);
      }
      setInitialized(true);
    }
    loadSettings();
  }, [audioInvalid, audioSuccess, durationNameDisplaying, enabledSound, initialized, navigation, session, vehicleNumber]);

  const pickAudioSuccess = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false, // Allows the user to select any file
        type: ['audio/mpeg'], // Accepts PDF and image files 
      });

      if (!result.canceled) {
        const successResult = result as DocumentPicker.DocumentPickerSuccessResult;

        if (successResult.assets.length <= 1) {
          setAudioSuccess(successResult.assets[0]);
        } else {
          console.log("Maximum 1 audio allowed.");
        }
      } else {
        console.log("Audio selection cancelled.");
      }
    } catch (error) {
      console.log("Error picking audio:", error);
    }
  };

  const pickAudioInvalid = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false, // Allows the user to select any file
        type: ['audio/mpeg'], // Accepts PDF and image files 
      });

      if (!result.canceled) {
        const successResult = result as DocumentPicker.DocumentPickerSuccessResult;

        // To limit the amount of documents that is added to the array "selectedDocuments"
        if (successResult.assets.length <= 1) {
          setAudioInvalid(successResult.assets[0]);
        } else {
          console.log("Maximum 1 audio allowed.");
        }
      } else {
        console.log("Audio selection cancelled.");
      }
    } catch (error) {
      console.log("Error picking audio:", error);
    }
  };

  const handleSave = () => {
    SecureStore.setItemAsync("settings", JSON.stringify({vehicleNumber, enabledSound, durationNameDisplaying, audioSuccess, audioInvalid}));
    router.push("/");
    return;
  }

  const handleUpdateData = () => {
    const updateData = async () => {
      try {
        let buses = await makeAuthenticatedRequest('buses?userId='+session?.user.id);
        if (buses?.error) {
          console.log(buses.error);
          throw new Error(buses?.error);
        }
        updateBuses(db, buses);

        let routes = await makeAuthenticatedRequest('routes?userId='+session?.user.id);
        if (routes?.error) {
          console.log(routes.error);
          throw new Error(routes?.error);
        }
        updateRoutes(db, routes);

        const cards = await makeAuthenticatedRequest('access-cards?userId='+session?.user.id);
        if (cards?.error) {
          console.log(cards.error);
          throw new Error(cards?.error);
        }
        updateAccessCards(db, cards);
        Alert.alert('Данные обновлены');
      } catch (error) {
          Alert.alert('ERROR', 'Невозможно обновить данные, попытайтесь позже', [{text: 'OK'}]);
          console.log("Error fetching data:", error);
      } finally {
          setLoading(false);
      }
    };

    updateData();
    setLoading(true);
    return;
  }

  if (session == null) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <ThemedView style={styles.globalContainer}>
      <ThemedView style={styles.stepContainer}>
        <ThemedText>Номер ТС</ThemedText>
        <ThemedTextInput
          placeholder="Формат AA(777)(777) или А(777)АА(777)"
          defaultValue={vehicleNumber}
          onChangeText={(value) => setVehicleNumber(value)}
        />

        <ThemedView style={styles.soundSwitchConteiner}>
          <ThemedText>Включить звуковые сигналы</ThemedText>
          <ThemedSwitch style={styles.soundSwitch}
            value={enabledSound}
            onValueChange={(value) => setEnabledSound(value)}
          />
        </ThemedView>

        <ThemedText>Звук для успешного считывания пропуска - {audioSuccess? audioSuccess.name: 'Не выбрано'}</ThemedText>
        <Button title="Выбрать" onPress={() => pickAudioSuccess()} />

        <ThemedText>Звук для невалидного пропуска - {audioInvalid? audioInvalid.name: 'Не выбрано'}</ThemedText>
        <Button title="Выбрать" onPress={() => pickAudioInvalid()} />

        <ThemedText>Время отображения ФИО сотрудника</ThemedText>
        <ThemedTextInput
          placeholder="Время в секундах"
          defaultValue={durationNameDisplaying.toString()}
          onChangeText={(value) => setDurationNameDisplaying(parseInt(value) || 0)}
        />

        <ThemedView style={styles.saveButton}>
          <Button title="Сохранить" onPress={() => handleSave()} />
        </ThemedView>

        <ThemedView style={styles.updateButton}>
          { 
              loading 
            ?
              <ThemedText>Загрузка...</ThemedText>
            : 
              <Button title="Обновить данные" onPress={() => handleUpdateData()} color="green" />
          }
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
  logo: {
    marginTop: 50,
    marginLeft: 'auto',
    marginRight: 'auto',
    height: 140,
    width: 346,
  },
  updateButton: {
    marginTop: 75,
  },
  soundSwitchConteiner: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    marginTop: 20,
  },
  soundSwitch: {
    marginTop: -10,
    marginLeft: 'auto',
  },
  saveButton: {
    marginTop: 20,
  }
});

