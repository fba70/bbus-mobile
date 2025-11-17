import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform, Pressable, StyleSheet, } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function QrCamera(props: { onQrScanned: (arg0: string) => void; }) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();

  const isPermissionGranted = Boolean(permission?.granted);

  return (
    <ThemedView style={{ paddingTop: insets.top, ...styleSheet.container }}>
      {Platform.OS === "android" ? <StatusBar hidden /> : <StatusBar style="auto" />}

      <ThemedText style={styleSheet.mainText}>QR Code Scanner</ThemedText>

      {isPermissionGranted ? 
        <CameraView
            style={styleSheet.camStyle}
            facing="front"
            barcodeScannerSettings={
                {
                    barcodeTypes: ['qr'],
                }
            }

            onBarcodeScanned={
                ({ data }) => {
                    console.log(data); // here you can get your barcode id or url
                    props.onQrScanned(data);
                }
            }
        />
        :
        <Pressable style={[styleSheet.mainBtn, styleSheet.btnGreen]} onPress={requestPermission}>
          <ThemedText>Request Permission</ThemedText>
        </Pressable>
      }
    </ThemedView>
  );
}

const styleSheet = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: 10
  },
  mainBtn: {
    width: 200,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  btnGreen: {
    backgroundColor: "#0BCD4C",
  },
  btnYellow: {
    backgroundColor: "yellow",
  },
  mainText: {
    fontSize: 20,
    fontWeight: "bold"
  },
  camStyle: {
    position: 'absolute',
    width: 300,
    height: 300
  },
});