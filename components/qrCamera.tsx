import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
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
        <Pressable style={[styleSheet.mainBtn, styleSheet.btnGreen]} onPress={requestPermission}>
          <ThemedText>Разрешить снимать</ThemedText>
        </Pressable>
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
  btnGreen: {
    backgroundColor: "#0BCD4C",
  },
  btnYellow: {
    backgroundColor: "yellow",
  },
  camStyle: {
    position: 'absolute',
    width: 300,
    height: 300
  },
});