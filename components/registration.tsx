import Nfc from '@/components/nfc';
import QrCamera from '@/components/qrCamera';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Image } from "expo-image";
import React from 'react';
import { StyleSheet, } from 'react-native';
import 'react-native-reanimated';

export default function Registration(props: any) {
    console.log(props.route);
    const logo = props.route.organization?.metadata ? JSON.parse(props.route.organization?.metadata).logo: "";
    console.log(logo);
    return <ThemedView style={styles.globalContainer}>
                <ThemedText style={styles.textContainer}>{props.route.organization.name}</ThemedText>
                <ThemedText style={styles.textContainer}>{props.route.routeName}</ThemedText>
                {logo === "" 
                ?
                    <Image source={logo} style={styles.logo}/>
                :
                    <Image source={require("@/assets/images/Logo_BBUS.webp")} style={styles.logo}/>
                }
                <ThemedView style={styles.container}>
                    <QrCamera onQrScanned={(data) => console.log(data)} />
                    <Nfc onNfcScanned={(data) => console.log(data)} />
                </ThemedView>;
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
  container: {
    height: '50%',
    width: '100%',
  },
  logo: {
    marginLeft: 'auto',
    marginRight: 'auto',
    width: 100,
    height: 100
  }
});
