import { ThemedTextInput } from "@/components/themed-input";
import { ThemedSwitch } from "@/components/themed-switch";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { authClient } from "@/lib/auth-client";
import { makeAuthenticatedRequest } from '@/lib/request';
import * as DocumentPicker from 'expo-document-picker';
import { router } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from "react";
import { Alert, Button, StyleSheet } from "react-native";

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [enabledSound, setEnabledSound] = useState(false);
  const [durationNameDisplaying, setDurationNameDisplaying] = useState(5);
  const [audioSuccess, setAudioSuccess] = useState<DocumentPicker.DocumentPickerAsset>();
  const [audioInvalid, setAudioInvalid] = useState<DocumentPicker.DocumentPickerAsset>();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      if (initialized) return;
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
  }, [audioInvalid, audioSuccess, durationNameDisplaying, enabledSound, initialized, vehicleNumber]);

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
    router.push('/main');
    return;
  }

  const handleUpdateData = () => {
    const updateData = async () => {
      const { data: session } = authClient.useSession();
      try {
          setLoading(true);
          const routes = await makeAuthenticatedRequest('routes?userId='+session?.user.id);
          console.log(routes);
          // update storage
      } catch (error) {
          Alert.alert('ERROR', 'Невозможно обновить данные, попытайтесь позже', [{text: 'OK'}]);
          console.log("Error fetching data:", error);
      } finally {
          setLoading(false);
      }
    };

    updateData();
  }

  if (loading) {
    return <ThemedView style={styles.globalContainer}>
            <ThemedText style={styles.textContainer}>Загрузка...</ThemedText>
          </ThemedView>;
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

        <Button title="Сохранить" onPress={() => handleSave()} />
        <ThemedView style={styles.updateButton}>
          <Button title="Обновить данные" onPress={() => handleUpdateData()} color="green" />
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
  textContainer: {
    top: '50%',
    left: '45%',
    position: 'absolute',
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
  },
  soundSwitch: {
    marginTop: -10,
    marginLeft: 'auto',
  }
});

