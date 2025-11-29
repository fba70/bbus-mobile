import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function QrCamera(props: { onQrScanned: (arg0: string) => void; containerStyle?: any; facing?: any;}) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();

  const isPermissionGranted = Boolean(permission?.granted);

  return (
    <ThemedView style={[{ paddingTop: insets.top, ...styleSheet.container }, props.containerStyle]}>
      {isPermissionGranted ? 
        <CameraView
            style={styleSheet.camStyle}
            facing={props.facing}
            animateShutter={true}
            barcodeScannerSettings={
                {
                    barcodeTypes: ['qr'],
                }
            }
            onBarcodeScanned={
                ({ data }) => {
                    props.onQrScanned(data);
                }
            }
        />
        :
        <TouchableOpacity onPress={() => requestPermission()}>
          <ThemedText style={[styleSheet.mainBtn, styleSheet.redButton]}>Разрешить снимать</ThemedText>
        </TouchableOpacity>
      }
    </ThemedView>
  );
}

const styleSheet = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  mainBtn: {
    width: 200,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
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
  },
  camStyle: {
    position: 'absolute',
    width: 300,
    height: 300
  },
});